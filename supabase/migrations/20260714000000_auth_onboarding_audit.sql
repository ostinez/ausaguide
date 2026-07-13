-- Migration: Complete Authentication and Onboarding Audit Support
-- 1. Ensure profiles table has id_verified, verification_status, banned, license_url, and license_status
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_status TEXT CHECK (license_status IN ('pending', 'approved', 'rejected'));

-- 2. Redefine handle_new_user() trigger to NOT default the role to 'traveler' if not present in metadata (allowing NULL initial state)
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
  _username   TEXT;
BEGIN
  _email     := COALESCE(NEW.email, '');
  _full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(_email, '@', 1)
  );
  _role := NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), '');
  _username := NULLIF(TRIM(LOWER(NEW.raw_user_meta_data->>'username')), '');

  -- Validate role if provided, otherwise leave it NULL
  IF _role IS NOT NULL AND _role NOT IN ('traveler', 'host', 'admin') THEN
    _role := NULL;
  END IF;

  RAISE LOG '[handle_new_user] Creating profile user_id=% email=% full_name=% role=% username=%',
    NEW.id, _email, _full_name, _role, _username;

  INSERT INTO public.profiles (
    id, email, full_name, role, username, languages, created_at, updated_at
  )
  VALUES (
    NEW.id, _email, _full_name, _role, _username, ARRAY['English']::text[], NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email      = EXCLUDED.email,
      full_name  = CASE
                     WHEN TRIM(public.profiles.full_name) = '' OR public.profiles.full_name IS NULL
                     THEN EXCLUDED.full_name
                     ELSE public.profiles.full_name
                   END,
      username   = COALESCE(EXCLUDED.username, public.profiles.username),
      role       = COALESCE(EXCLUDED.role, public.profiles.role),
      updated_at = NOW();

  RAISE LOG '[handle_new_user] Profile upsert done user_id=%', NEW.id;
  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[handle_new_user] ERROR user_id=% sqlstate=% msg=%',
    NEW.id, SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$$;

-- 3. Redefine prevent_profile_role_change() trigger to allow transition from NULL to traveler/host
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only raise exception if OLD role is already set (not NULL) and NEW role is different
  IF OLD.role IS NOT NULL AND OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'User role cannot be changed once set.';
  END IF;
  RETURN NEW;
END;
$$;
