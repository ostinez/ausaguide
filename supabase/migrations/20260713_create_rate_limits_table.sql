-- Create rate_limits table for login and action throttling
-- Run this in: Supabase Dashboard → SQL Editor
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  key       TEXT        NOT NULL,
  count     INTEGER     DEFAULT 0,
  reset_at  TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(key)
);

-- Index for fast key lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits (key);

-- Allow service role to read/write (needed for edge functions / server-side calls)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write rate_limits (not exposed to the public anon key)
CREATE POLICY "Service role full access" ON public.rate_limits
  FOR ALL USING (auth.role() = 'service_role');
