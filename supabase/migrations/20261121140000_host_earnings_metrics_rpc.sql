-- ==============================================================================
-- Migration: Host Earnings Analytics & Aggregation RPC
-- File: supabase/migrations/20261121140000_host_earnings_metrics_rpc.sql
-- ==============================================================================

-- 1. Ensure host_payout_amount and host_paid columns exist on bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS host_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS host_payout_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS host_payout_id TEXT,
  ADD COLUMN IF NOT EXISTS host_payout_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_amount NUMERIC;

-- 2. Create the server-side aggregation function for fast fintech earnings dashboards
CREATE OR REPLACE FUNCTION public.get_host_earnings_metrics(p_host_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_earnings NUMERIC := 0;
  v_available_payout NUMERIC := 0;
  v_weekly_data JSONB;
  v_type_split JSONB;
  v_recent_tx JSONB;
BEGIN
  -- Total completed earnings
  SELECT COALESCE(SUM(COALESCE(host_payout_amount, payment_amount, total_price, 0)), 0)
  INTO v_total_earnings
  FROM public.bookings
  WHERE host_id = p_host_id
    AND status = 'completed';

  -- Available for Payout (summing host_payout_amount where host_paid is true)
  SELECT COALESCE(SUM(COALESCE(host_payout_amount, payment_amount, total_price, 0)), 0)
  INTO v_available_payout
  FROM public.bookings
  WHERE host_id = p_host_id
    AND (host_paid = true OR status = 'completed');

  -- 4-week earnings aggregation (last 4 calendar weeks)
  SELECT COALESCE(jsonb_agg(w ORDER BY w.week_num ASC), '[]'::jsonb)
  INTO v_weekly_data
  FROM (
    SELECT 
      series.n AS week_num,
      'Week ' || series.n AS week_label,
      to_char(CURRENT_DATE - ((4 - series.n) * 7 + 6) * INTERVAL '1 day', 'Mon DD') || ' - ' ||
      to_char(CURRENT_DATE - ((4 - series.n) * 7) * INTERVAL '1 day', 'Mon DD') AS date_range,
      COALESCE(SUM(COALESCE(b.host_payout_amount, b.payment_amount, b.total_price, 0)), 0) AS earnings
    FROM generate_series(1, 4) AS series(n)
    LEFT JOIN public.bookings b ON b.host_id = p_host_id
      AND b.status = 'completed'
      AND b.booking_date >= (CURRENT_DATE - ((4 - series.n) * 7 + 6) * INTERVAL '1 day')
      AND b.booking_date <= (CURRENT_DATE - ((4 - series.n) * 7) * INTERVAL '1 day' + INTERVAL '1 day')
    GROUP BY series.n
  ) w;

  -- Revenue split by Tour Type (Virtual vs Physical)
  SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)
  INTO v_type_split
  FROM (
    SELECT 
      CASE 
        WHEN COALESCE(t.tour_type, b.booking_type, 'in_person') = 'virtual' THEN 'Virtual Tours'
        ELSE 'Physical Tours'
      END AS name,
      COALESCE(SUM(COALESCE(b.host_payout_amount, b.payment_amount, b.total_price, 0)), 0) AS value
    FROM public.bookings b
    LEFT JOIN public.tours t ON b.tour_id = t.id
    WHERE b.host_id = p_host_id
      AND b.status = 'completed'
    GROUP BY 
      CASE 
        WHEN COALESCE(t.tour_type, b.booking_type, 'in_person') = 'virtual' THEN 'Virtual Tours'
        ELSE 'Physical Tours'
      END
  ) t;

  -- Recent 10 completed transactions with M-Pesa payout flag
  SELECT COALESCE(jsonb_agg(tx), '[]'::jsonb)
  INTO v_recent_tx
  FROM (
    SELECT 
      b.id,
      b.guest_name,
      b.booking_date,
      COALESCE(t.title, 'Kenyan Tour Experience') AS tour_title,
      COALESCE(t.tour_type, b.booking_type, 'in_person') AS tour_type,
      COALESCE(b.host_payout_amount, b.payment_amount, b.total_price, 0) AS payout_amount,
      COALESCE(b.currency, 'KES') AS currency,
      COALESCE(b.host_paid, true) AS host_paid,
      b.status
    FROM public.bookings b
    LEFT JOIN public.tours t ON b.tour_id = t.id
    WHERE b.host_id = p_host_id
      AND b.status = 'completed'
    ORDER BY b.booking_date DESC, b.created_at DESC
    LIMIT 10
  ) tx;

  RETURN jsonb_build_object(
    'total_earnings', v_total_earnings,
    'available_for_payout', v_available_payout,
    'weekly_earnings', v_weekly_data,
    'tour_type_split', v_type_split,
    'recent_transactions', v_recent_tx
  );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_host_earnings_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_host_earnings_metrics(UUID) TO service_role;
