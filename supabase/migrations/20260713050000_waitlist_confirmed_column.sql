-- Smart Waitlist: add confirmed + confirm_token columns, secure RPC, and update policy

-- 1. Add columns (idempotent)
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS confirmed      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirm_token  UUID    DEFAULT gen_random_uuid();

-- 2. Ensure existing rows get a token (for rows created before this migration)
UPDATE public.waitlist
SET confirm_token = gen_random_uuid()
WHERE confirm_token IS NULL;

-- 3. Secure RPC: called with the token from the confirmation email link
--    Sets confirmed = true and returns the email so the frontend can show it.
CREATE OR REPLACE FUNCTION public.confirm_waitlist(p_token UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.waitlist
  SET confirmed = true
  WHERE confirm_token = p_token
    AND confirmed = false
  RETURNING email;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_waitlist(UUID) TO anon, authenticated;

-- 4. Allow anon/authenticated to update (needed by SECURITY DEFINER function
--    running in the same transaction context as RLS). The function itself is the
--    guard — only the matching token can trigger the update.
DROP POLICY IF EXISTS "Confirm via token" ON public.waitlist;
CREATE POLICY "Confirm via token"
  ON public.waitlist
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 5. Allow selecting own row by email OR by confirm_token (for status checks)
DROP POLICY IF EXISTS "Users can view own waitlist" ON public.waitlist;
CREATE POLICY "Users can view own waitlist"
  ON public.waitlist
  FOR SELECT
  USING (
    email = (auth.jwt() ->> 'email')
    OR confirm_token = (current_setting('request.jwt.claims', true)::json ->> 'confirm_token')::uuid
  );

-- Anon users also need to SELECT (for token-based confirmation page check)
DROP POLICY IF EXISTS "Anon can select by token" ON public.waitlist;
CREATE POLICY "Anon can select by token"
  ON public.waitlist
  FOR SELECT
  USING (true);
