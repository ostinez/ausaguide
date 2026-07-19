-- ============================================================
-- AusaGuide Admin Profile Fix
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Step 1: Check the current state of the admin account
SELECT 
  au.id AS auth_id,
  au.email,
  au.email_confirmed_at,
  p.id AS profile_id,
  p.role,
  p.full_name
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'ausaguides@gmail.com';

-- Step 2: Set the role to 'admin' on the profiles row
-- (safe to run even if already correct)
UPDATE public.profiles
SET 
  role = 'admin',
  updated_at = NOW()
WHERE email = 'ausaguides@gmail.com';

-- Step 3: If no profile row exists yet, insert one.
-- ONLY run this if Step 1 returned 0 rows in the profiles columns.
-- Replace '<AUTH_USER_ID>' with the id from Step 1 (auth_id column).
--
-- INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
-- VALUES (
--   '<AUTH_USER_ID>',
--   'ausaguides@gmail.com',
--   'admin',
--   'AusaGuide Admin',
--   NOW(),
--   NOW()
-- )
-- ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- Step 4: Verify the fix
SELECT id, email, role, full_name FROM public.profiles WHERE email = 'ausaguides@gmail.com';
