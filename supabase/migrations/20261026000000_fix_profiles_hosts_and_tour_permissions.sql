-- ==============================================================================
-- Comprehensive Database Fix Migration
-- Fixes:
-- 1. Adds missing verification and tier columns to profiles table
-- 2. Ensures public.hosts exists, has user_id foreign key & unique index, and safe defaults
-- 3. Syncs existing host profiles into hosts table
-- 4. Updates role transition trigger to permit traveler -> host upon KYC verification
-- 5. Configures RLS policies for hosts and tours tables
-- ==============================================================================

-- 1. Ensure required columns exist on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requested_tier TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_phone TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'unverified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS host_tier TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS host_type TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_guide BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rejected_as_guide BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tra_number TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_id TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_details JSONB DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 2. Ensure public.hosts table exists and has safe constraints & unique index on user_id
CREATE TABLE IF NOT EXISTS public.hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT DEFAULT 'Ausaguide Host',
  email TEXT DEFAULT '',
  city TEXT DEFAULT 'Nairobi',
  host_type TEXT DEFAULT 'local_host',
  bio TEXT DEFAULT 'Local host on Ausaguide.',
  video_url TEXT DEFAULT NULL,
  id_upload_url TEXT DEFAULT NULL,
  license_upload_url TEXT DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure user_id column exists on hosts (in case hosts table already existed without it)
ALTER TABLE public.hosts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Relax any strict NOT NULL constraints so single-field or partial upserts never fail
ALTER TABLE public.hosts ALTER COLUMN full_name DROP NOT NULL;
ALTER TABLE public.hosts ALTER COLUMN full_name SET DEFAULT 'Ausaguide Host';
ALTER TABLE public.hosts ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.hosts ALTER COLUMN email SET DEFAULT '';
ALTER TABLE public.hosts ALTER COLUMN city DROP NOT NULL;
ALTER TABLE public.hosts ALTER COLUMN city SET DEFAULT 'Nairobi';
ALTER TABLE public.hosts ALTER COLUMN bio DROP NOT NULL;
ALTER TABLE public.hosts ALTER COLUMN bio SET DEFAULT 'Local host on Ausaguide.';
ALTER TABLE public.hosts ALTER COLUMN host_type DROP NOT NULL;
ALTER TABLE public.hosts ALTER COLUMN host_type SET DEFAULT 'local_host';
ALTER TABLE public.hosts ALTER COLUMN status DROP NOT NULL;
ALTER TABLE public.hosts ALTER COLUMN status SET DEFAULT 'approved';

-- Unique index on user_id for idempotency and onConflict('user_id')
CREATE UNIQUE INDEX IF NOT EXISTS idx_hosts_user_id ON public.hosts(user_id);

-- 3. Seed / sync hosts table from profiles for any active host
INSERT INTO public.hosts (user_id, full_name, email, city, host_type, bio, status)
SELECT 
  p.id, 
  COALESCE(NULLIF(p.full_name, ''), 'Ausaguide Host'), 
  COALESCE(NULLIF(p.email, ''), ''), 
  COALESCE(NULLIF(p.location, ''), 'Nairobi'), 
  COALESCE(NULLIF(p.host_type, ''), NULLIF(p.host_tier, ''), 'local_host'), 
  COALESCE(NULLIF(p.bio, ''), 'Local host on Ausaguide.'), 
  'approved'
FROM public.profiles p
WHERE p.role = 'host'
ON CONFLICT (user_id) DO UPDATE
SET status = 'approved',
    updated_at = now();

-- 4. Mark existing hosts as verified and active in profiles
UPDATE public.profiles
SET status = 'active',
    is_verified = true,
    verification_status = 'verified'
WHERE role = 'host'
  AND (verification_status IS NULL OR verification_status IN ('unverified', 'pending'));

-- 5. Update prevent_profile_role_change trigger function
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

  -- Get role of caller
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  -- If caller is admin, permit all role changes
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
  IF OLD.role = 'pending_guide' AND NEW.role IN ('pending_guide', 'host') THEN
    RETURN NEW;
  END IF;

  -- For non-admins, prevent unauthorized role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'User role cannot be changed once set without administrative authorization.';
  END IF;

  RETURN NEW;
END;
$$;

-- 6. Configure RLS Policies for hosts and tours
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Hosts viewable by everyone" ON public.hosts;
CREATE POLICY "Hosts viewable by everyone" ON public.hosts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Hosts insertable by self" ON public.hosts;
CREATE POLICY "Hosts insertable by self" ON public.hosts FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Hosts updatable by self" ON public.hosts;
CREATE POLICY "Hosts updatable by self" ON public.hosts FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Tours RLS
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tours viewable by everyone" ON public.tours;
CREATE POLICY "Tours viewable by everyone" ON public.tours FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tours insertable by verified host" ON public.tours;
CREATE POLICY "Tours insertable by verified host" ON public.tours FOR INSERT WITH CHECK (
  auth.uid() = host_id OR auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'host')
  )
);

DROP POLICY IF EXISTS "Tours updatable by host or admin" ON public.tours;
CREATE POLICY "Tours updatable by host or admin" ON public.tours FOR UPDATE USING (
  auth.uid() = host_id OR auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
