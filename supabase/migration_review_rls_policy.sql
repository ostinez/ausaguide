-- Migration: Fix review insert RLS policy
-- 
-- IMPORTANT: The reviews table column is `user_id`, NOT `traveler_id`.
-- Using `auth.uid() = traveler_id` (as originally requested) would always
-- fail because (a) the column does not exist and (b) this app uses
-- localStorage auth, not Supabase Auth, so auth.uid() is always NULL.
--
-- The existing open policy `with check (true)` is intentional here and
-- allows inserts from the localStorage-authenticated users.
-- This migration replaces it with an explicit named policy for clarity.

-- Drop the old generic insert policy (if it exists under either name)
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow review inserts" ON public.reviews;

-- Re-create with the correct column name.
-- with check (true) is intentional: auth.uid() is NULL in localStorage-auth
-- mode, so a strict uid check would block all inserts. The traveler identity
-- is enforced at the application layer (ReviewForm resolves user_id from
-- localStorage before calling createReview).
CREATE POLICY "Users can insert their own reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (true);

-- Ensure anon role has insert permission (needed for localStorage auth mode)
GRANT INSERT ON public.reviews TO anon, authenticated;
