-- ==============================================================================
-- Align Conversations (participant_a, participant_b) and Messages (receiver_id)
-- ==============================================================================

-- 1. Ensure receiver_id column exists on public.messages
ALTER TABLE IF EXISTS public.messages 
  ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Ensure participant_a and participant_b exist on public.conversations
ALTER TABLE IF EXISTS public.conversations 
  ADD COLUMN IF NOT EXISTS participant_a UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS participant_b UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Create indexes for high-speed queries on participant_a, participant_b, and receiver_id
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_a_b ON public.conversations(participant_a, participant_b);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_b_a ON public.conversations(participant_b, participant_a);

-- 4. Enable Row Level Security policies matching participant_a and participant_b
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = participant_a OR auth.uid() = participant_b);

DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
CREATE POLICY "Users can insert their own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

-- 5. Enable Realtime Replication
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

-- 6. Add to supabase_realtime publication
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
END $$;
