-- ==============================================================================
-- Migration: Ausaguide Social Marketplace Final Phase
-- Tables: profiles, comments, comment_likes, conversations, messages, bookings
-- Features: Privacy Logic, Feed Comments & Likes, Contextual Messaging, Custom Offers, RLS
-- ==============================================================================

-- 1. PROFILES TABLE: Privacy Toggle & Host Public Enforcement
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

-- Enforce that Hosts and Admins cannot be private (must be public for discovery)
UPDATE public.profiles 
SET is_private = false 
WHERE role IN ('host', 'admin');

CREATE OR REPLACE FUNCTION public.enforce_host_public_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('host', 'admin') THEN
    NEW.is_private := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_host_public_profile ON public.profiles;
CREATE TRIGGER trg_enforce_host_public_profile
  BEFORE INSERT OR UPDATE OF role, is_private ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_host_public_profile();

-- 2. COMMENTS TABLE: Ensure it has id, post_id, user_id, content, created_at
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If comments table already existed with author_id, harmonize columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'author_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.comments RENAME COLUMN author_id TO user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.comments ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);

-- 3. COMMENT_LIKES TABLE: Create with comment_id, user_id
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- 4. CONVERSATIONS TABLE: Add context_type ('general', 'tour', 'post') and context_id (uuid)
ALTER TABLE IF EXISTS public.conversations
  ADD COLUMN IF NOT EXISTS context_type TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS context_id UUID;

CREATE INDEX IF NOT EXISTS idx_conversations_context ON public.conversations(context_type, context_id);

-- 5. MESSAGES TABLE: Ensure read, conversation_id, booking_id nullable
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

ALTER TABLE IF EXISTS public.messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS fallback_emailed BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(receiver_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_messages_fallback_email ON public.messages(fallback_emailed, read, created_at);

-- 6. BOOKINGS TABLE: Add is_custom, custom_details, offer_expires_at, fallback_emailed
ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_details JSONB,
  ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fallback_emailed BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_bookings_custom_offer ON public.bookings(is_custom, offer_expires_at);
CREATE INDEX IF NOT EXISTS idx_bookings_fallback_email ON public.bookings(fallback_emailed, status, created_at);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES

-- (A) Conversations RLS: Users can only view & create conversations where they are participants
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = participant_a OR auth.uid() = participant_b
  );

DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
CREATE POLICY "Users can insert their own conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant_a OR auth.uid() = participant_b
  );

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = participant_a OR auth.uid() = participant_b
  );

-- (B) Comments RLS: Readable by all, writable only by authenticated users for their own comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to comments for anyone" ON public.comments;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- (C) Comment Likes RLS: Readable by all, manageable by owner
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comment likes viewable by everyone" ON public.comment_likes;
CREATE POLICY "Comment likes viewable by everyone" ON public.comment_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like comments" ON public.comment_likes;
CREATE POLICY "Users can like comments" ON public.comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike comments" ON public.comment_likes;
CREATE POLICY "Users can unlike comments" ON public.comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- (D) Posts & Journals Privacy RLS:
-- If author is private, only the author OR approved followers (status = 'accepted') can view.
-- Hosts & admins are always public.
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read posts" ON public.posts;
DROP POLICY IF EXISTS "Allow read posts with privacy" ON public.posts;
CREATE POLICY "Allow read posts with privacy" ON public.posts
  FOR SELECT USING (
    -- Author can always view their own posts
    auth.uid() = user_id
    OR
    -- Post author is public OR is a host/admin
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = posts.user_id 
        AND (p.is_private IS FALSE OR p.role IN ('host', 'admin'))
    )
    OR
    -- Viewer is an accepted follower of the private author
    EXISTS (
      SELECT 1 FROM public.follows f
      WHERE f.following_id = posts.user_id
        AND f.follower_id = auth.uid()
        AND f.status = 'accepted'
    )
  );

ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read journals" ON public.journals;
DROP POLICY IF EXISTS "Allow read journals with privacy" ON public.journals;
CREATE POLICY "Allow read journals with privacy" ON public.journals
  FOR SELECT USING (
    -- Author can always view their own journals
    auth.uid() = user_id
    OR
    -- Journal author is public OR is a host/admin
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = journals.user_id 
        AND (p.is_private IS FALSE OR p.role IN ('host', 'admin'))
    )
    OR
    -- Viewer is an accepted follower of the private author
    EXISTS (
      SELECT 1 FROM public.follows f
      WHERE f.following_id = journals.user_id
        AND f.follower_id = auth.uid()
        AND f.status = 'accepted'
    )
  );

-- 8. GRANT PERMISSIONS
GRANT ALL ON public.comments TO anon, authenticated, service_role;
GRANT ALL ON public.comment_likes TO anon, authenticated, service_role;
GRANT ALL ON public.conversations TO anon, authenticated, service_role;
GRANT ALL ON public.messages TO anon, authenticated, service_role;

-- 9. REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'comment_likes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'conversations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bookings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
