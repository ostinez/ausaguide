-- Allow admins to select all waitlist entries
DROP POLICY IF EXISTS "Admins can view all waitlist entries" ON public.waitlist;
CREATE POLICY "Admins can view all waitlist entries"
  ON public.waitlist
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
