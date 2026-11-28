-- Ensure RLS is enabled on public.bookings and travelers/hosts can SELECT their own bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bookings'
      AND policyname = 'Travelers can view own bookings'
  ) THEN
    CREATE POLICY "Travelers can view own bookings" ON public.bookings
      FOR SELECT TO authenticated
      USING (auth.uid() = guest_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bookings'
      AND policyname = 'Hosts can view own bookings'
  ) THEN
    CREATE POLICY "Hosts can view own bookings" ON public.bookings
      FOR SELECT TO authenticated
      USING (auth.uid() = host_id);
  END IF;
END $$;
