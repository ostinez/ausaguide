-- Add username column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Update trigger function to handle username from metadata
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
  _role := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''),
    'traveler'
  );
  _username := NULLIF(TRIM(LOWER(NEW.raw_user_meta_data->>'username')), '');

  IF _role NOT IN ('traveler', 'host', 'admin') THEN
    _role := 'traveler';
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
