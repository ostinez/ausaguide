-- Add optional interest column to waitlist table if needed in the future
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS interest TEXT[];
