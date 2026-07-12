-- Drop old tables if they exist to prevent schema conflicts
DROP TABLE IF EXISTS public.direct_messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id)
);

-- Alter messages table to add conversation_id and image_url columns
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can insert their own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Update RLS policies on messages to support conversations
DROP POLICY IF EXISTS "Users can send and read their own messages" ON public.messages;
DROP POLICY IF EXISTS "Anon can manage messages" ON public.messages;

CREATE POLICY "Users can read conversation messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id 
    OR EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id 
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert conversation messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

-- Create chat-images private storage bucket with size and MIME filters
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images', 
  'chat-images', 
  false, 
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = false, 
    file_size_limit = 10485760, 
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage policies for chat-images bucket
CREATE POLICY "Users upload own chat images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Participants read chat images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE (c.participant1_id = auth.uid() AND c.participant2_id = (storage.foldername(name))[1]::uuid)
           OR (c.participant2_id = auth.uid() AND c.participant1_id = (storage.foldername(name))[1]::uuid)
      )
    )
  );
