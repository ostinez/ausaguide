-- Migration: Follow System with Private Follow Requests and Reachable Messaging
-- Created: 2026-08-18

-- 1. Ensure is_private column exists on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Create or upgrade public.follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  is_private    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 3. If table already exists, ensure status and is_private columns are present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='follows' AND column_name='status') THEN
    ALTER TABLE public.follows ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='follows' AND column_name='is_private') THEN
    ALTER TABLE public.follows ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='follows' AND column_name='updated_at') THEN
    ALTER TABLE public.follows ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- 4. Create Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_status ON public.follows(status);
CREATE INDEX IF NOT EXISTS idx_follows_combined ON public.follows(follower_id, following_id, status);

-- 5. Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Drop old policies if any
DROP POLICY IF EXISTS "Public read follows" ON public.follows;
DROP POLICY IF EXISTS "Users insert own follows" ON public.follows;
DROP POLICY IF EXISTS "Users delete own follows" ON public.follows;
DROP POLICY IF EXISTS "Users read own follows" ON public.follows;
DROP POLICY IF EXISTS "Users insert follows" ON public.follows;
DROP POLICY IF EXISTS "Users update own follows" ON public.follows;
DROP POLICY IF EXISTS "Users delete own follows" ON public.follows;

-- RLS Policies
-- Users can see their own follows (as follower or target following) or accepted public follows
CREATE POLICY "Users read own follows" ON public.follows
  FOR SELECT
  USING (
    auth.uid() = follower_id 
    OR auth.uid() = following_id 
    OR status = 'accepted'
  );

-- Users can initiate a follow request for themselves
CREATE POLICY "Users insert follows" ON public.follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Target user can update follow status (e.g., accept or decline) or follower can update
CREATE POLICY "Users update own follows" ON public.follows
  FOR UPDATE
  USING (auth.uid() = following_id OR auth.uid() = follower_id);

-- Both follower and target user can delete/cancel a follow
CREATE POLICY "Users delete own follows" ON public.follows
  FOR DELETE
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- 6. Grant Permissions
GRANT ALL ON public.follows TO anon, authenticated, service_role;

-- 7. Add to Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'follows'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
