-- Fix prevent_profile_role_change trigger to allow NULL -> role transitions
-- This migration ensures admins (service role) can set role when it's currently NULL
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only raise exception if OLD role is already set (not NULL) AND being changed to something different
  IF OLD.role IS NOT NULL AND OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'User role cannot be changed once set.';
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure trigger is still active
DROP TRIGGER IF EXISTS before_profile_role_update ON public.profiles;
CREATE TRIGGER before_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_change();

-- Now safely fix roles for accounts with NULL role
UPDATE public.profiles SET role = 'host'     WHERE email = 'ostinez48@gmail.com'     AND role IS NULL;
UPDATE public.profiles SET role = 'traveler' WHERE email = 'ostinez23@gmail.com'     AND role IS NULL;
UPDATE public.profiles SET role = 'admin'    WHERE email = 'ausaguides@gmail.com'    AND role IS NULL;
UPDATE public.profiles SET role = 'host'     WHERE email = 'austinmbote07@gmail.com' AND role IS NULL;

-- Ensure host records exist for host-role users
INSERT INTO public.hosts (id, name, bio, location, languages)
SELECT p.id, p.full_name, 'Local guide and tour host in Kenya.', 'Nairobi', ARRAY['English', 'Swahili']
FROM public.profiles p
WHERE p.role = 'host'
  AND p.email IN ('austinmbote07@gmail.com', 'ostinez48@gmail.com')
  AND NOT EXISTS (SELECT 1 FROM public.hosts h WHERE h.id = p.id)
ON CONFLICT (id) DO NOTHING;
