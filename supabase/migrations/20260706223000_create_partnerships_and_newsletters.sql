CREATE TABLE partnership_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  type TEXT NOT NULL, -- 'tree-planting' or 'mental-health'
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  interest TEXT, -- 'tree-planting', 'mental-health', or 'general'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE partnership_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public insert on partnership_inquiries
CREATE POLICY "Allow public insert on partnership_inquiries" 
ON partnership_inquiries FOR INSERT 
WITH CHECK (true);

-- Allow public insert on newsletter_subscriptions
CREATE POLICY "Allow public insert on newsletter_subscriptions" 
ON newsletter_subscriptions FOR INSERT 
WITH CHECK (true);
