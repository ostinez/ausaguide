-- Migration: Add 'failed' and 'declined' and 'checked_in' to booking status check constraint
-- 
-- The original constraint on public.bookings.status only allowed 'pending', 'confirmed', 'completed', 'cancelled'.
-- We need to support 'failed' for Stripe webhook payments failing, and 'declined' / 'checked_in' as specified in types.

-- Drop the existing check constraint (PostgreSQL automatically names inline checks based on table_column_check)
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add the new check constraint supporting all statuses
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'declined', 'failed', 'checked_in'));
