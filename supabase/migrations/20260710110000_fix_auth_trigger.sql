-- Fix / Recreate on_auth_user_created trigger with fallbacks and exception handling
-- Ensure INSERT RLS policy on public.profiles is present

-- Allow an authenticated user to insert their own profile row.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger function definition
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

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant table access to internal Supabase roles
GRANT SELECT, INSERT, UPDATE ON public.profiles TO supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO postgres;
