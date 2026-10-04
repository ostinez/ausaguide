-- Fix Waitlist Schema, Deduplicate, and Permissions once and for all
-- Idempotent, safe script that cleans duplicate entries, ensures all columns, indices, RLS policies, and cache reloads

-- 1. Ensure the waitlist table exists with all required columns
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  role TEXT DEFAULT 'traveler',
  interest TEXT[] DEFAULT '{}'::text[],
  reason TEXT,
  location TEXT,
  notified BOOLEAN DEFAULT false,
  confirmed BOOLEAN DEFAULT false,
  confirm_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add any missing columns to existing table
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'traveler',
  ADD COLUMN IF NOT EXISTS interest TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirm_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Ensure name and role don't fail if null
ALTER TABLE public.waitlist ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.waitlist ALTER COLUMN role DROP NOT NULL;

-- 4. Clean up any existing duplicate emails before creating the unique index
DELETE FROM public.waitlist
WHERE id NOT IN (
  SELECT DISTINCT ON (lower(email)) id
  FROM public.waitlist
  ORDER BY lower(email), created_at DESC NULLS LAST
);

-- 5. Create unique index on email (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_email_unique ON public.waitlist (lower(email));

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- 7. Clean up old conflicting policies
DROP POLICY IF EXISTS "Anyone can insert into waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Users can view own waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anon can select by token" ON public.waitlist;
DROP POLICY IF EXISTS "Confirm via token" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can view all waitlist entries" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can delete waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow all select for admin/users" ON public.waitlist;
DROP POLICY IF EXISTS "Public insert waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Public select waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Public update waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Public delete waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can select waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can update waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can delete waitlist" ON public.waitlist;

-- 8. Create clean, comprehensive RLS Policies
CREATE POLICY "Anyone can insert into waitlist" 
  ON public.waitlist 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can select waitlist" 
  ON public.waitlist 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update waitlist" 
  ON public.waitlist 
  FOR UPDATE 
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete waitlist" 
  ON public.waitlist 
  FOR DELETE 
  TO anon, authenticated
  USING (true);

-- 9. Grant permissions to roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist TO anon, authenticated, service_role;

-- 10. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
