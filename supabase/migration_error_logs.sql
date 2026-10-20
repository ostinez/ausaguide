-- Migration: error_logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Allow insert by service role and authenticated/anon
CREATE POLICY "Allow insert into error_logs" ON public.error_logs 
  FOR INSERT WITH CHECK (true);

-- Allow admins to read error logs
CREATE POLICY "Allow admins to read error_logs" ON public.error_logs 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

GRANT SELECT, INSERT ON public.error_logs TO anon, authenticated, service_role;
