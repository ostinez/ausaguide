-- Run this SQL in your Supabase SQL Editor to create waitlist and tree_commitments tables

-- 1. Create waitlist Table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  interest TEXT[], -- ['tree-planting', 'mental-health'] or both
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT false
);

-- 2. Create tree_commitments Table
CREATE TABLE IF NOT EXISTS public.tree_commitments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  tree_name TEXT,
  dedication TEXT,
  tree_id TEXT UNIQUE NOT NULL,
  certificate_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  planted_at TIMESTAMPTZ
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_commitments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for waitlist
DROP POLICY IF EXISTS "Anyone can insert into waitlist" ON public.waitlist;
CREATE POLICY "Anyone can insert into waitlist" 
  ON public.waitlist 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own waitlist" ON public.waitlist;
CREATE POLICY "Users can view own waitlist" 
  ON public.waitlist 
  FOR SELECT 
  USING (email = auth.jwt() ->> 'email');

-- 5. RLS Policies for tree_commitments
DROP POLICY IF EXISTS "Anyone can insert into tree_commitments" ON public.tree_commitments;
CREATE POLICY "Anyone can insert into tree_commitments" 
  ON public.tree_commitments 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own tree_commitments" ON public.tree_commitments;
CREATE POLICY "Users can view own tree_commitments" 
  ON public.tree_commitments 
  FOR SELECT 
  USING (user_id = auth.uid() OR email = auth.jwt() ->> 'email');

-- 6. Grant permissions to anonymous and authenticated users
GRANT SELECT, INSERT ON public.waitlist TO anon, authenticated;
GRANT SELECT, INSERT ON public.tree_commitments TO anon, authenticated;
