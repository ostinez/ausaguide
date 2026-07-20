-- Migration: Update rate_limits table policies to allow client-side throttling
--
-- This enables public/authenticated clients to check and update their rate limit entries.

DROP POLICY IF EXISTS "Allow all access to rate_limits for anyone" ON public.rate_limits;
DROP POLICY IF EXISTS "Service role full access" ON public.rate_limits;

-- Allow anon and authenticated roles to perform all operations
CREATE POLICY "Allow all access to rate_limits for anyone"
  ON public.rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ensure correct permissions are granted to client-side roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limits TO anon, authenticated;
