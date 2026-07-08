-- Run this SQL in your Supabase SQL Editor to create travel_commitments table

-- 1. Create travel_commitments Table
CREATE TABLE IF NOT EXISTS public.travel_commitments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  dedication TEXT,
  commitment_id TEXT UNIQUE NOT NULL,
  certificate_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.travel_commitments ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for travel_commitments
DROP POLICY IF EXISTS "Anyone can insert travel_commitments" ON public.travel_commitments;
CREATE POLICY "Anyone can insert travel_commitments" 
  ON public.travel_commitments 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own travel_commitments" ON public.travel_commitments;
CREATE POLICY "Users can view own travel_commitments" 
  ON public.travel_commitments 
  FOR SELECT 
  USING (user_id = auth.uid() OR email = auth.jwt() ->> 'email');

-- 4. Grant permissions to anonymous and authenticated users
GRANT SELECT, INSERT ON public.travel_commitments TO anon, authenticated;
