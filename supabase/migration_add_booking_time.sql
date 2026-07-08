-- Migration to add booking_time to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_time time;
