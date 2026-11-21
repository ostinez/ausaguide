-- ==============================================================================
-- Migration: Direct Messaging & Location Sharing & Safe Columns
-- 1. Drop NOT NULL constraint on messages.booking_id (enables chats without booking)
-- 2. Add latitude, longitude, and safety columns to public.profiles
-- ==============================================================================

-- 1. Drop NOT NULL constraint on booking_id in public.messages
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'booking_id'
  ) THEN
    ALTER TABLE public.messages ALTER COLUMN booking_id DROP NOT NULL;
  END IF;
END $$;

-- 2. Ensure all columns needed for direct messaging exist on public.messages
ALTER TABLE IF EXISTS public.messages 
  ADD COLUMN IF NOT EXISTS conversation_id TEXT,
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS notification_type TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Add location and profile columns
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS share_location BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trust_score DOUBLE PRECISION DEFAULT 100,
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 50;

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_profiles_lat_lng ON public.profiles(latitude, longitude);
