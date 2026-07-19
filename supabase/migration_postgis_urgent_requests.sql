-- ── Enable PostGIS Extension ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── Update profiles Table with Geo-spatial and Proximity Match Fields ───
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coords GEOGRAPHY(POINT, 4326);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS price_per_hour NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_type TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS urgent_requests_accepted INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS urgent_requests_received INTEGER DEFAULT 0;

-- Create spatial index on profiles coords for high performance
CREATE INDEX IF NOT EXISTS profiles_coords_idx ON public.profiles USING GIST (coords);

-- ── Create urgent_requests Table for Real-time Traveler Requests ────────
CREATE TABLE IF NOT EXISTS public.urgent_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  traveler_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  budget NUMERIC NOT NULL,
  experience_type TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  matched_host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes'
);

-- Create spatial index on urgent_requests location
CREATE INDEX IF NOT EXISTS urgent_requests_location_idx ON public.urgent_requests USING GIST (location);

-- ── Configure Row Level Security (RLS) for urgent_requests ──────────────
ALTER TABLE public.urgent_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read urgent requests" ON public.urgent_requests;
CREATE POLICY "Public read urgent requests" 
  ON public.urgent_requests FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert urgent requests" ON public.urgent_requests;
CREATE POLICY "Anyone can insert urgent requests" 
  ON public.urgent_requests FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update urgent requests" ON public.urgent_requests;
CREATE POLICY "Anyone can update urgent requests" 
  ON public.urgent_requests FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- ── Configure Grants for API Roles ──────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.urgent_requests TO anon, authenticated;

-- ── Enable Supabase Realtime Replication ──────────────────────────────────
-- We check if the table is already in publication to avoid duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'urgent_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.urgent_requests;
  END IF;
END $$;

-- ── Create PostGIS Database RPC function to find nearest hosts ─────────────
CREATE OR REPLACE FUNCTION find_urgent_hosts(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  max_distance_meters DOUBLE PRECISION,
  max_budget NUMERIC,
  req_experience_types TEXT[]
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  languages TEXT[],
  price_per_hour NUMERIC,
  experience_type TEXT[],
  distance_meters DOUBLE PRECISION
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.bio,
    p.phone,
    p.languages,
    p.price_per_hour,
    p.experience_type,
    ST_Distance(p.coords, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) AS distance_meters
  FROM public.profiles p
  WHERE 
    p.role = 'host'
    AND p.is_available = true
    AND (p.price_per_hour IS NULL OR p.price_per_hour <= max_budget)
    AND (p.experience_type && req_experience_types)
    AND ST_DWithin(p.coords, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, max_distance_meters)
  ORDER BY distance_meters ASC
  LIMIT 5;
END;
$$;

-- Grant execution permission on RPC function to API roles
GRANT EXECUTE ON FUNCTION find_urgent_hosts(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, TEXT[]) TO anon, authenticated;
