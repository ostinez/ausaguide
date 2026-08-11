-- Migration to add IntaSend payment fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC,
ADD COLUMN IF NOT EXISTS payment_currency TEXT DEFAULT 'KES',
ADD COLUMN IF NOT EXISTS host_paid BOOLEAN DEFAULT false;
