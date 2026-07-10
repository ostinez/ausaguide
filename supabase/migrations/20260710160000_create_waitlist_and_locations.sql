-- 1. Recreate waitlist Table with role, location, and reason fields
DROP TABLE IF EXISTS public.waitlist CASCADE;

CREATE TABLE public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('traveler', 'host', 'both')),
  location TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT false
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert into waitlist" 
  ON public.waitlist 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view own waitlist" 
  ON public.waitlist 
  FOR SELECT 
  USING (email = auth.jwt() ->> 'email');

GRANT SELECT, INSERT ON public.waitlist TO anon, authenticated;

-- 2. Add Location Sharing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS share_location BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_location_lat FLOAT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_location_lng FLOAT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_location_updated TIMESTAMPTZ;
