-- Fix Admin Role Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- URL: https://supabase.com/dashboard/project/sdbvvcjnlergsmcsorrv/sql/new

-- Step 1: Temporarily drop the role-change prevention trigger
DROP TRIGGER IF EXISTS before_profile_role_update ON public.profiles;

-- Step 2: Update the admin user's role to 'admin' and set username
UPDATE public.profiles 
SET 
  role = 'admin',
  username = 'ausaguide',
  full_name = 'Super Admin',
  is_verified = true
WHERE email = 'ostinez48@gmail.com';

-- Also update by user ID as fallback
UPDATE public.profiles 
SET 
  role = 'admin',
  username = 'ausaguide', 
  full_name = 'Super Admin',
  is_verified = true
WHERE id = 'f5db8b1b-8380-49dc-850e-1d2048cc05b1';

-- Step 3: Re-create the trigger so other users can't change roles
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

CREATE TRIGGER before_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_change();

-- Step 4: Verify the fix
SELECT id, email, role, username, full_name FROM public.profiles 
WHERE email = 'ostinez48@gmail.com';
