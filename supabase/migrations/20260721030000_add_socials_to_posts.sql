-- Add social link columns to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tiktok TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS reddit TEXT;
