-- Add decline_reason column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- Add index for faster queries on decline_reason
CREATE INDEX IF NOT EXISTS idx_bookings_decline_reason ON public.bookings(decline_reason) WHERE decline_reason IS NOT NULL;

-- Add status_history column if not yet present
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;
