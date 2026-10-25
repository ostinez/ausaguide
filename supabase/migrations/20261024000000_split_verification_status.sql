-- Migration: Add status column to profiles for verification split (active vs pending)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Update status for existing profiles
UPDATE public.profiles
SET status = 'active'
WHERE role = 'admin'
   OR (role = 'host' AND (is_verified = true OR verification_status IN ('approved', 'verified') OR verified_guide = true));

-- Ensure hosts table status is approved for verified hosts
UPDATE public.hosts
SET status = 'approved'
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE status = 'active' AND role = 'host'
);
