-- ================================================================
-- Posts table
-- ================================================================
CREATE TABLE IF NOT EXISTS posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read posts"
  ON posts FOR SELECT USING (true);

CREATE POLICY "Users insert own posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own posts"
  ON posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own posts"
  ON posts FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- Journals table
-- ================================================================
CREATE TABLE IF NOT EXISTS journals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read journals"
  ON journals FOR SELECT USING (true);

CREATE POLICY "Users insert own journals"
  ON journals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own journals"
  ON journals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own journals"
  ON journals FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- Social links on profiles
-- ================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiktok   TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook  TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reddit    TEXT;

-- ================================================================
-- Host tier on profiles
-- ================================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS host_tier TEXT
    CHECK (host_tier IN ('certified_guide', 'local_host'));

-- ================================================================
-- Image support on messages (booking-scoped, kept for reference)
-- ================================================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;
