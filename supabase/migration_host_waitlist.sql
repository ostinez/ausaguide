CREATE TABLE host_waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
