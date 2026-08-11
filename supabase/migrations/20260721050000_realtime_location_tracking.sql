-- Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Ensure profiles table has coords column and a GiST index
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coords GEOGRAPHY(POINT, 4326);
CREATE INDEX IF NOT EXISTS profiles_coords_idx ON public.profiles USING GIST (coords);

-- Create location_updates table
CREATE TABLE IF NOT EXISTS public.location_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on location_updates
ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;

-- Policies for location_updates
DROP POLICY IF EXISTS "Hosts can manage own location updates" ON public.location_updates;
CREATE POLICY "Hosts can manage own location updates"
  ON public.location_updates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read active shared location updates" ON public.location_updates;
CREATE POLICY "Public read active shared location updates"
  ON public.location_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = location_updates.user_id
        AND p.share_location = true
        AND (EXTRACT(EPOCH FROM (NOW() - location_updates.updated_at)) < 300)
    )
  );

-- Grant access to authenticated and anon roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.location_updates TO anon, authenticated;

-- Trigger to automatically update coords geography column on profiles when lat/lng changes
CREATE OR REPLACE FUNCTION update_profiles_coords()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_location_lat IS NOT NULL AND NEW.last_location_lng IS NOT NULL THEN
    NEW.coords := ST_SetSRID(ST_MakePoint(NEW.last_location_lng, NEW.last_location_lat), 4326)::geography;
  ELSE
    NEW.coords := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_profiles_coords ON public.profiles;
CREATE TRIGGER trg_update_profiles_coords
BEFORE INSERT OR UPDATE OF last_location_lat, last_location_lng ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_coords();

-- Ensure location_updates is in Supabase Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'location_updates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.location_updates;
  END IF;
END $$;
