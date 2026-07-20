-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create saves table
CREATE TABLE IF NOT EXISTS public.saves (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public read likes" ON public.likes;
DROP POLICY IF EXISTS "Users insert own likes" ON public.likes;
DROP POLICY IF EXISTS "Users delete own likes" ON public.likes;

DROP POLICY IF EXISTS "Public read follows" ON public.follows;
DROP POLICY IF EXISTS "Users insert own follows" ON public.follows;
DROP POLICY IF EXISTS "Users delete own follows" ON public.follows;

DROP POLICY IF EXISTS "Owner read saves" ON public.saves;
DROP POLICY IF EXISTS "Users insert own saves" ON public.saves;
DROP POLICY IF EXISTS "Users delete own saves" ON public.saves;

-- RLS Policies for likes
CREATE POLICY "Public read likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users insert own likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for follows
CREATE POLICY "Public read follows" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Users insert own follows" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users delete own follows" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for saves
CREATE POLICY "Owner read saves" ON public.saves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own saves" ON public.saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own saves" ON public.saves
  FOR DELETE USING (auth.uid() = user_id);

-- Grant privileges
GRANT ALL ON public.likes TO anon, authenticated, service_role;
GRANT ALL ON public.follows TO anon, authenticated, service_role;
GRANT ALL ON public.saves TO anon, authenticated, service_role;
