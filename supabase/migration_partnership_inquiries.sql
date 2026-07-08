-- Run this SQL in your Supabase SQL Editor to create partnership_inquiries table

-- 1. Create partnership_inquiries Table
CREATE TABLE IF NOT EXISTS public.partnership_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  type TEXT, -- 'tree-planting', 'mental-health', 'both'
  status TEXT DEFAULT 'pending', -- 'pending', 'contacted', 'closed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.partnership_inquiries ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Anyone can submit partnership inquiry" ON public.partnership_inquiries;
CREATE POLICY "Anyone can submit partnership inquiry" 
  ON public.partnership_inquiries 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view partnership inquiries" ON public.partnership_inquiries;
CREATE POLICY "Admins can view partnership inquiries" 
  ON public.partnership_inquiries 
  FOR SELECT 
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- 4. Grant permissions to anonymous and authenticated users
GRANT SELECT, INSERT ON public.partnership_inquiries TO anon, authenticated;
