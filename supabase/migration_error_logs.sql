-- Migration: Create error_logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT,
  error_context TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Allow insert by anon, authenticated, and service_role
CREATE POLICY "Allow public insert into error_logs" ON public.error_logs
  FOR INSERT WITH CHECK (true);

-- Allow admins to read error_logs
CREATE POLICY "Allow admins to read error_logs" ON public.error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

GRANT SELECT, INSERT ON public.error_logs TO anon, authenticated, service_role;
