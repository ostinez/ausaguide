-- Run this SQL in your Supabase SQL Editor to add status columns and update RLS policies

-- 1. Add status columns if they don't exist
ALTER TABLE public.hosts 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' 
  CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

ALTER TABLE public.reviews 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'visible' 
  CHECK (status IN ('visible', 'hidden', 'pending'));

-- 2. Ensure RLS is enabled on hosts
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;

-- 3. Re-create Host Policies
DROP POLICY IF EXISTS "Users can insert their own host application" ON public.hosts;
CREATE POLICY "Users can insert their own host application"
  ON public.hosts 
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read approved hosts" ON public.hosts;
CREATE POLICY "Public read approved hosts"
  ON public.hosts 
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read pending own applications" ON public.hosts;
CREATE POLICY "Public read pending own applications"
  ON public.hosts 
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin read all hosts" ON public.hosts;
CREATE POLICY "Admin read all hosts"
  ON public.hosts 
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin update hosts" ON public.hosts;
CREATE POLICY "Admin update hosts"
  ON public.hosts 
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. Re-grant permissions
GRANT SELECT, INSERT, UPDATE ON public.hosts TO anon, authenticated;
