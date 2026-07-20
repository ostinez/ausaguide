-- Migration: Create increment_tour_view RPC function
--
-- This function increments the views counter on tours and is executed via RPC.

ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_tour_view(tour_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.tours
  SET views = views + 1
  WHERE id = tour_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_tour_view(uuid) TO anon, authenticated;
