-- Create indexes to optimize query search performance
CREATE INDEX IF NOT EXISTS tours_location_name_idx ON public.tours(location_name);
CREATE INDEX IF NOT EXISTS tours_price_idx ON public.tours(price);
CREATE INDEX IF NOT EXISTS bookings_host_id_idx ON public.bookings(host_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(status);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
