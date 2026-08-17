-- ==============================================================================
-- Ensure Messages 'read' Column, Indexes, and Realtime Publication
-- ==============================================================================

-- 1. Ensure read column exists on public.messages
ALTER TABLE IF EXISTS public.messages 
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- 2. Ensure sender_type exists on public.messages
ALTER TABLE IF EXISTS public.messages 
  ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'user';

-- 3. Ensure conversation_id and image_url exist
ALTER TABLE IF EXISTS public.messages 
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.messages 
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. Create performance indexes for rapid conversation & unread lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON public.messages(receiver_id, read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant_a, participant_b);

-- 5. Enable Realtime on tables if not already enabled
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

-- 6. Add tables to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
END $$;
