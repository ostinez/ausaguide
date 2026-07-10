-- Create function to prevent updating profiles.role
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'User role cannot be changed once set.';
  END IF;
  RETURN NEW;
END;
$$;

-- Create BEFORE UPDATE trigger on public.profiles
DROP TRIGGER IF EXISTS before_profile_role_update ON public.profiles;
CREATE TRIGGER before_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_change();
