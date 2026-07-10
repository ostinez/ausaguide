-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public insert on newsletter_subscribers
DROP POLICY IF EXISTS "Allow public insert on newsletter_subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Allow public insert on newsletter_subscribers" 
  ON public.newsletter_subscribers 
  FOR INSERT 
  WITH CHECK (true);

-- Allow public select (own email only or authenticated)
DROP POLICY IF EXISTS "Allow users to select their own subscription" ON public.newsletter_subscribers;
CREATE POLICY "Allow users to select their own subscription"
  ON public.newsletter_subscribers
  FOR SELECT
  USING (email = auth.jwt() ->> 'email');

-- Grant permissions
GRANT SELECT, INSERT ON public.newsletter_subscribers TO anon, authenticated, postgres, supabase_auth_admin;
