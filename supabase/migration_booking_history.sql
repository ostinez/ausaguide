-- Add decline_reason and status_history columns to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS decline_reason text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status_history jsonb NOT NULL DEFAULT '[]'::jsonb;
