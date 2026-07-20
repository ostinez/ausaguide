-- Migration: Allow admin users to change roles (bypass prevent_profile_role_change trigger)
-- This relies on the public.is_admin() SECURITY DEFINER function created in 20260720190000

CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can update any user's role freely
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- For non-admins, prevent role changes after it has been set
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'User role cannot be changed once set.';
  END IF;

  RETURN NEW;
END;
$$;
