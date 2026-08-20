-- ==============================================================================
-- Fix messages booking_id NOT NULL constraint & enhance chat features
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

-- 2. Ensure all essential columns exist on public.messages
ALTER TABLE IF EXISTS public.messages 
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS notification_type TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deleted_for_traveler BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_for_host BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_by_users TEXT[] DEFAULT '{}';

-- 3. Ensure essential columns exist on public.conversations
ALTER TABLE IF EXISTS public.conversations
  ADD COLUMN IF NOT EXISTS participant_a UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS participant_b UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_notification_type ON public.messages(notification_type);

-- 5. Row Level Security policies for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert messages into their conversations" ON public.messages;
CREATE POLICY "Users can insert messages into their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    OR sender_id IS NULL -- for automated system messages
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their messages" ON public.messages;
CREATE POLICY "Users can update their messages" ON public.messages
  FOR UPDATE USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

-- 6. Ensure publication contains messages for realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
