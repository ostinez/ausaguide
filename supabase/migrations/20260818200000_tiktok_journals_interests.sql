-- ================================================================
-- Migration: Travel Journals, Interests, and Recommendations
-- ================================================================

-- 1. Create or extend travel_journals table for private reconnaissance notes & tips
CREATE TABLE IF NOT EXISTS travel_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  tour_id UUID REFERENCES tours(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  tips TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for travel_journals
ALTER TABLE travel_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own travel_journals" 
  ON travel_journals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own travel_journals" 
  ON travel_journals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own travel_journals" 
  ON travel_journals FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own travel_journals" 
  ON travel_journals FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_travel_journals_user_id ON travel_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_journals_booking_id ON travel_journals(booking_id);
CREATE INDEX IF NOT EXISTS idx_travel_journals_tour_id ON travel_journals(tour_id);

-- 2. Create interests table
CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  category TEXT
);

-- Enable RLS for interests (public read)
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read interests" 
  ON interests FOR SELECT 
  USING (true);

-- 3. Create user_interests junction table
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, interest_id)
);

-- Enable RLS for user_interests
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own user_interests" 
  ON user_interests FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own user_interests" 
  ON user_interests FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own user_interests" 
  ON user_interests FOR DELETE 
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);

-- 4. Seed default interests
INSERT INTO interests (name, icon, category) VALUES
  ('🌿 Nature & Wildlife', '🌿', 'adventure'),
  ('🏛️ History & Culture', '🏛️', 'culture'),
  ('🍽️ Food & Dining', '🍽️', 'lifestyle'),
  ('🎨 Arts & Crafts', '🎨', 'culture'),
  ('🏄 Adventure Sports', '🏄', 'adventure'),
  ('📸 Photography', '📸', 'hobby'),
  ('🧘 Wellness & Relaxation', '🧘', 'lifestyle'),
  ('🎵 Music & Nightlife', '🎵', 'entertainment'),
  ('🛍️ Shopping & Markets', '🛍️', 'lifestyle'),
  ('🚶 Walking Tours', '🚶', 'adventure'),
  ('🏖️ Beaches & Water', '🏖️', 'adventure'),
  ('🏔️ Mountains & Hiking', '🏔️', 'adventure'),
  ('🐘 Safari & Wildlife', '🐘', 'adventure'),
  ('🏕️ Camping & Glamping', '🏕️', 'adventure'),
  ('☕ Coffee & Tea Tours', '☕', 'food')
ON CONFLICT (name) DO NOTHING;
