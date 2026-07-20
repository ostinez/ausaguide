-- Fix prevent_profile_role_change trigger function to allow updates if the caller is an admin or service role
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Bypass if service role
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Get the role of the user performing the update
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  
  -- Bypass if admin
  IF caller_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Only raise exception if OLD role is already set (not NULL) AND being changed to something different
  IF OLD.role IS NOT NULL AND OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'User role cannot be changed once set.';
  END IF;
  RETURN NEW;
END;
$$;

-- Allow admin users to update any user's profile
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admin users to read any profile
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow public read of admin profiles (to display support details)
DROP POLICY IF EXISTS "Public read admin profiles" ON public.profiles;
CREATE POLICY "Public read admin profiles"
  ON public.profiles FOR SELECT
  USING (role = 'admin');
