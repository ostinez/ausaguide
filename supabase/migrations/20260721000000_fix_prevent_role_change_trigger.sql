-- Migration: Update prevent_profile_role_change trigger to allow admin role updates reliably

CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Get the role of the caller directly from profiles table
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  -- If caller is admin, allow update
  IF caller_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Also check if it's the database owner or service role (auth.uid() is null in service role)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- For non-admins, prevent role changes after it has been set
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'User role cannot be changed once set.';
  END IF;

  RETURN NEW;
END;
$$;
