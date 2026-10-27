-- ============================================================================
-- ADD TRUST SCORE COLUMN TO PROFILES TABLE
-- ============================================================================
-- Migration: 20261028000000_add_trust_score_to_profiles.sql
-- Description:
--   Ensures the `trust_score` column exists on the `public.profiles` table,
--   backfills any existing null rows, sets a safe default of 100, adds a
--   performance index, and reloads the PostgREST schema cache.
--   Prevents "column profiles_1.trust_score does not exist" errors in joined
--   queries (e.g., tours joining host profiles).
-- ============================================================================

-- 1. Safely add trust_score column to public.profiles if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'trust_score'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN trust_score NUMERIC DEFAULT 100;
  END IF;
END $$;

-- 2. Backfill existing null records with default 100
UPDATE public.profiles
SET trust_score = 100
WHERE trust_score IS NULL;

-- 3. Ensure the column has default 100 for future inserts
ALTER TABLE public.profiles
  ALTER COLUMN trust_score SET DEFAULT 100;

-- 4. Create index on trust_score for efficient ordering and ranking
CREATE INDEX IF NOT EXISTS idx_profiles_trust_score
  ON public.profiles(trust_score DESC);

-- 5. Add column documentation
COMMENT ON COLUMN public.profiles.trust_score IS 'Host reliability and trust score benchmark (defaults to 100)';

-- 6. Signal PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
