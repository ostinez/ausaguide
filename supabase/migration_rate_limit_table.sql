-- Migration: Create rate_limits table for analytics and rate limiting
--
-- This table tracks request counts per IP or user key.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index to allow upserting based on rate limiting key
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);

-- Enable RLS so that frontend clients can read and write limit entries
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated roles to perform all operations
DROP POLICY IF EXISTS "Allow all access to rate_limits for anyone" ON public.rate_limits;
CREATE POLICY "Allow all access to rate_limits for anyone"
  ON public.rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limits TO anon, authenticated;
