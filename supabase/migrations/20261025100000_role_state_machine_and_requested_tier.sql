-- Migration: Role State Machine, Requested Tier, and Payout Phone
-- Supports tiers: local, certified_guide, security
-- Handles transition to 'pending_guide' role for certified guides until admin approval

-- 1. Add requested_tier and payout_phone to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requested_tier TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_phone TEXT DEFAULT NULL;

-- 2. Update prevent_profile_role_change trigger function
-- Allows:
-- - Admins to manually override any user role
-- - Service role (auth.uid() is null)
-- - Onboarding & Didit transitions:
--   * traveler -> host (for verified local hosts)
--   * traveler -> pending_guide (for certified guides awaiting admin review)
--   * pending_guide -> host (when admin approves guide)
--   * NULL -> any role
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Service role execution (auth.uid() is null) always permitted
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the role of the caller directly from profiles table
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  -- If caller is admin, allow any update
  IF caller_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Allow user themselves to transition during host onboarding / verification:
  -- - from traveler (or null) to host (for local hosts upon KYC)
  -- - from traveler (or null) to pending_guide (for certified guides awaiting review)
  IF (OLD.role IS NULL OR OLD.role = 'traveler') AND NEW.role IN ('host', 'pending_guide') THEN
    RETURN NEW;
  END IF;

  -- Allow pending_guide to maintain their state or be updated
  IF OLD.role = 'pending_guide' AND NEW.role = 'pending_guide' THEN
    RETURN NEW;
  END IF;

  -- For non-admins, prevent unauthorized role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'User role cannot be changed once set without administrative authorization.';
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Synchronize existing certified guides who are pending review
UPDATE public.profiles
SET role = 'pending_guide',
    requested_tier = 'certified_guide'
WHERE role = 'traveler'
  AND (host_tier = 'certified_guide' OR host_type IN ('certified_guide', 'guide') OR license_status = 'pending')
  AND (verified_guide IS NULL OR verified_guide = false);

-- Ensure local hosts have requested_tier populated
UPDATE public.profiles
SET requested_tier = 'local'
WHERE requested_tier IS NULL
  AND (host_tier = 'local_host' OR host_type IN ('local_host', 'local'));
