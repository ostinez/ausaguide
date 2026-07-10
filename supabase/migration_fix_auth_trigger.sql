-- ============================================================
-- migration_fix_auth_trigger.sql
-- Fix: Supabase 500 on signup
--
-- Problems addressed:
--   1. on_auth_user_created trigger was missing / broken
--   2. No INSERT RLS policy on public.profiles
--   3. full_name NOT NULL with no COALESCE fallback
--
-- HOW TO APPLY:
--   Supabase Dashboard -> SQL Editor -> New Query -> paste -> Run
--   Safe to run multiple times (idempotent).
-- ============================================================

-- ====== 1. INSERT RLS policies on profiles ==================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow an authenticated user to insert their own profile row.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ====== 2. handle_new_user function =========================
-- SECURITY DEFINER: runs as function owner (postgres), bypasses RLS.
-- COALESCE: full_name falls back to email prefix if missing/blank.
-- ON CONFLICT (id) DO UPDATE: handles race between trigger + client upsert.
-- EXCEPTION handler: logs errors, never re-raises so auth.signUp() succeeds.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _full_name  TEXT;
  _role       TEXT;
  _email      TEXT;
BEGIN
  _email     := COALESCE(NEW.email, '');
  _full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(_email, '@', 1)
  );
  _role := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''),
    'traveler'
  );

  IF _role NOT IN ('traveler', 'host', 'admin') THEN
    _role := 'traveler';
  END IF;

  RAISE LOG '[handle_new_user] Creating profile user_id=% email=% full_name=% role=%',
    NEW.id, _email, _full_name, _role;

  INSERT INTO public.profiles (
    id, email, full_name, role, languages, created_at, updated_at
  )
  VALUES (
    NEW.id, _email, _full_name, _role, ARRAY['English']::text[], NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email      = EXCLUDED.email,
      full_name  = CASE
                     WHEN TRIM(public.profiles.full_name) = '' OR public.profiles.full_name IS NULL
                     THEN EXCLUDED.full_name
                     ELSE public.profiles.full_name
                   END,
      role       = EXCLUDED.role,
      updated_at = NOW();

  RAISE LOG '[handle_new_user] Profile upsert done user_id=%', NEW.id;
  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[handle_new_user] ERROR user_id=% sqlstate=% msg=%',
    NEW.id, SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, supabase_auth_admin;

-- ====== 3. Create / replace the trigger =====================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ====== 4. Grant table access to internal Supabase roles ====
GRANT SELECT, INSERT, UPDATE ON public.profiles TO supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO postgres;

-- ====== 5. Verification queries (run separately to check) ===
-- SELECT trigger_name, event_object_schema, event_object_table
--   FROM information_schema.triggers
--  WHERE trigger_name = 'on_auth_user_created';
--
-- SELECT policyname, cmd FROM pg_policies
--  WHERE tablename = 'profiles' AND cmd = 'INSERT';
