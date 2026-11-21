-- ==============================================================================
-- Migration: Add Things to Know to Tours and Qualifications to Profiles
-- Date: 2026-11-21
-- ==============================================================================

-- 1. Add "Things to Know" columns to tours table
ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS meeting_point TEXT,
  ADD COLUMN IF NOT EXISTS guest_requirements TEXT,
  ADD COLUMN IF NOT EXISTS what_to_bring TEXT;

-- 2. Add Qualifications and Profile Stats columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS qualifications_experience TEXT,
  ADD COLUMN IF NOT EXISTS qualifications_highlights TEXT,
  ADD COLUMN IF NOT EXISTS qualifications_education TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.8,
  ADD COLUMN IF NOT EXISTS tours_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS share_location BOOLEAN DEFAULT false;

-- 3. Ensure messages table allows direct messaging without booking
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'booking_id' 
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.messages ALTER COLUMN booking_id DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id TEXT;

-- 4. Create index on conversation_id for performant querying
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
  ON public.messages (conversation_id);

-- 5. Comments for PostgREST / Swagger schema
COMMENT ON COLUMN public.tours.meeting_point IS 'Text description of meeting place or landmark';
COMMENT ON COLUMN public.tours.guest_requirements IS 'Age limits, fitness levels, dress code, etc.';
COMMENT ON COLUMN public.tours.what_to_bring IS 'Items guests should bring (e.g. sunscreen, water, walking shoes)';
COMMENT ON COLUMN public.profiles.qualifications_experience IS 'Host experience overview or years of guiding';
COMMENT ON COLUMN public.profiles.qualifications_highlights IS 'Notable career achievements or tour milestones';
COMMENT ON COLUMN public.profiles.qualifications_education IS 'Certifications, licenses, degrees, or specialized training';
