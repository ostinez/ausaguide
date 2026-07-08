-- Add views column if not exists
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

-- RPC to increment views
CREATE OR REPLACE FUNCTION increment_tour_view(tour_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.tours
  SET views = views + 1
  WHERE id = tour_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to execute function
GRANT EXECUTE ON FUNCTION increment_tour_view(uuid) TO anon, authenticated;
