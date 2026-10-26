-- ============================================================================
-- AUSAGUIDE DASHBOARDS, MAPS, RANKING ALGORITHM & DISPUTE RESOLUTION MIGRATION
-- ============================================================================

-- 1. TOURS TABLE: Add latitude and longitude
ALTER TABLE IF EXISTS public.tours
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

CREATE INDEX IF NOT EXISTS idx_tours_coordinates ON public.tours(latitude, longitude);

-- Default Kenya geographic center coordinates for existing tours without coordinates
UPDATE public.tours
SET latitude = -1.2921, longitude = 36.8219
WHERE latitude IS NULL OR longitude IS NULL;

-- 2. STRIKES TABLE: Track host cancellations (limit 10 before account review)
CREATE TABLE IF NOT EXISTS public.strikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_strikes_host_id ON public.strikes(host_id);
CREATE INDEX IF NOT EXISTS idx_strikes_created_at ON public.strikes(created_at);

-- 3. PROFILES TABLE: Add trust_score (numeric, default 5.0)
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS trust_score NUMERIC NOT NULL DEFAULT 5.0;

CREATE INDEX IF NOT EXISTS idx_profiles_trust_score ON public.profiles(trust_score DESC);

-- 4. BOOKINGS TABLE: Add dispute_status ('none', 'pending_refund', 'rescheduled', 'completed')
ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS dispute_status TEXT NOT NULL DEFAULT 'none';

CREATE INDEX IF NOT EXISTS idx_bookings_dispute_status ON public.bookings(dispute_status);

-- 5. THE RANKING ALGORITHM DATABASE FUNCTION
-- Formula: (Average Rating * 0.5) + (Completion Rate * 0.3) - (Number of Strikes * 0.2)
-- Bounded between 0.0 and 5.0, rounded to 2 decimal places.
CREATE OR REPLACE FUNCTION public.calculate_host_trust_score(p_host_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_avg_rating NUMERIC := 5.0;
  v_completed_count INT := 0;
  v_cancelled_count INT := 0;
  v_completion_rate_scaled NUMERIC := 5.0;
  v_strikes_count INT := 0;
  v_final_score NUMERIC := 5.0;
BEGIN
  -- 1. Average Rating from reviews (or host profile rating)
  SELECT COALESCE(AVG(r.rating), 5.0)
  INTO v_avg_rating
  FROM public.reviews r
  JOIN public.tours t ON t.id = r.tour_id
  WHERE t.host_id = p_host_id;

  -- 2. Completed vs Cancelled bookings for completion rate
  SELECT
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'cancelled')
  INTO v_completed_count, v_cancelled_count
  FROM public.bookings
  WHERE host_id = p_host_id;

  IF (v_completed_count + v_cancelled_count) > 0 THEN
    v_completion_rate_scaled := (v_completed_count::NUMERIC / (v_completed_count + v_cancelled_count)::NUMERIC) * 5.0;
  ELSE
    v_completion_rate_scaled := 5.0;
  END IF;

  -- 3. Strikes count
  SELECT COUNT(*)
  INTO v_strikes_count
  FROM public.strikes
  WHERE host_id = p_host_id;

  -- 4. Formula: (Average Rating * 0.5) + (Completion Rate * 0.3) - (Number of Strikes * 0.2)
  v_final_score := (v_avg_rating * 0.5) + (v_completion_rate_scaled * 0.3) - (v_strikes_count * 0.2);

  -- Clamp between 0.0 and 5.0
  v_final_score := GREATEST(0.0, LEAST(5.0, ROUND(v_final_score, 2)));

  -- Update profile record
  UPDATE public.profiles
  SET trust_score = v_final_score
  WHERE id = p_host_id;

  -- If strikes >= 10, mark status for review
  IF v_strikes_count >= 10 THEN
    UPDATE public.profiles
    SET status = 'under_review'
    WHERE id = p_host_id AND status != 'suspended';
  END IF;

  RETURN v_final_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to recalculate trust score whenever a strike is inserted
CREATE OR REPLACE FUNCTION public.trg_recalc_trust_score_on_strike()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.calculate_host_trust_score(NEW.host_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_strike_added ON public.strikes;
CREATE TRIGGER trg_strike_added
  AFTER INSERT OR UPDATE ON public.strikes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recalc_trust_score_on_strike();

-- Trigger to recalculate trust score when a booking status changes (completed or cancelled)
CREATE OR REPLACE FUNCTION public.trg_recalc_trust_score_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.host_id IS NOT NULL AND (NEW.status IN ('completed', 'cancelled') OR OLD.status != NEW.status) THEN
    PERFORM public.calculate_host_trust_score(NEW.host_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_status_trust_score ON public.bookings;
CREATE TRIGGER trg_booking_status_trust_score
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recalc_trust_score_on_booking();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES FOR STRIKES
ALTER TABLE public.strikes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts can view own strikes" ON public.strikes;
CREATE POLICY "Hosts can view own strikes" ON public.strikes
  FOR SELECT USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Authenticated users or hosts can record cancellation strike" ON public.strikes;
CREATE POLICY "Authenticated users or hosts can record cancellation strike" ON public.strikes
  FOR INSERT WITH CHECK (auth.uid() = host_id OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can view all strikes" ON public.strikes;
CREATE POLICY "Admins can view all strikes" ON public.strikes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. GRANTS AND REALTIME
GRANT ALL ON public.strikes TO anon, authenticated, service_role;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'strikes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.strikes;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
