CREATE TABLE donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'tree-planting' or 'mental-health'
  item_name TEXT NOT NULL,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on the table
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to donations for dynamic page statistics
CREATE POLICY "Allow public select on donations" 
ON donations FOR SELECT 
USING (true);

-- Allow inserting for all (since Edge Functions bypass RLS with service role anyway, but just in case)
CREATE POLICY "Allow public insert on donations" 
ON donations FOR INSERT 
WITH CHECK (true);
