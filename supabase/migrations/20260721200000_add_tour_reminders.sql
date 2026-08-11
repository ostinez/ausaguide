-- Migration: Add reminder_sent tracking column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reminder_scheduled_at TIMESTAMPTZ;

-- Index for efficient cron lookup of pending tour reminders
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_lookup 
ON public.bookings (status, reminder_sent, booking_date, booking_time)
WHERE status = 'confirmed' AND (reminder_sent IS FALSE OR reminder_sent IS NULL);
