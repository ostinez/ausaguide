-- Migration: Update handle_new_user() trigger to save newsletter_opt_in from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _full_name           TEXT;
  _role                TEXT;
  _email               TEXT;
  _username            TEXT;
  _newsletter_opt_in   BOOLEAN;
BEGIN
  _email     := COALESCE(NEW.email, '');
  _full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(_email, '@', 1)
  );
  _role := NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), '');
  _username := NULLIF(TRIM(LOWER(NEW.raw_user_meta_data->>'username')), '');
  _newsletter_opt_in := COALESCE((NEW.raw_user_meta_data->>'newsletter_opt_in')::boolean, false);

  -- Validate role if provided, otherwise leave it NULL
  IF _role IS NOT NULL AND _role NOT IN ('traveler', 'host', 'admin') THEN
    _role := NULL;
  END IF;

  RAISE LOG '[handle_new_user] Creating profile user_id=% email=% full_name=% role=% username=% newsletter_opt_in=%',
    NEW.id, _email, _full_name, _role, _username, _newsletter_opt_in;

  -- Check if a profile with the same email already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(email) = LOWER(_email)) THEN
    UPDATE public.profiles
    SET
      id = NEW.id,
      full_name = COALESCE(NULLIF(TRIM(_full_name), ''), full_name),
      username = COALESCE(_username, username),
      role = COALESCE(_role, role),
      newsletter_opt_in = COALESCE(_newsletter_opt_in, newsletter_opt_in),
      updated_at = NOW()
    WHERE LOWER(email) = LOWER(_email);
  ELSE
    INSERT INTO public.profiles (
      id, email, full_name, role, username, languages, newsletter_opt_in, created_at, updated_at
    )
    VALUES (
      NEW.id, _email, _full_name, _role, _username, ARRAY['English']::text[], _newsletter_opt_in, NOW(), NOW()
    );
  END IF;

  RAISE LOG '[handle_new_user] Profile upsert done user_id=%', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG '[handle_new_user] ERROR user_id=% sqlstate=% msg=%',
      NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$;
