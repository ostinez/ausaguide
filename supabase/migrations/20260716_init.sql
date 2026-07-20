-- Add missing verification columns to profiles table
-- Safe to run multiple times (IF NOT EXISTS)

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS id_verified        BOOLEAN       NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_id    TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT         DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS verification_date  TIMESTAMPTZ;

-- Verify the columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name   = 'profiles' 
  AND column_name IN ('id_verified','verification_id','verification_status','verification_date');
