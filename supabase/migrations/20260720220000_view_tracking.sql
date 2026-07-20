-- Migration: Create views table, add view_count columns, and setup automatic increment trigger

-- 1. Ensure view_count columns exist on all target tables
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.journals ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- 2. Create public.views table
CREATE TABLE IF NOT EXISTS public.views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('tour', 'post', 'journal', 'host')),
  target_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security (RLS) on views
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for public.views
DROP POLICY IF EXISTS "Anyone can insert views" ON public.views;
CREATE POLICY "Anyone can insert views"
  ON public.views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read views" ON public.views;
CREATE POLICY "Anyone can read views"
  ON public.views FOR SELECT
  USING (true);

-- 5. Create trigger function to automatically increment view_count on target tables
CREATE OR REPLACE FUNCTION public.increment_target_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.target_type = 'tour' THEN
    UPDATE public.tours
    SET view_count = COALESCE(view_count, 0) + 1,
        views = COALESCE(views, 0) + 1
    WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'post' THEN
    UPDATE public.posts
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'journal' THEN
    UPDATE public.journals
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'host' THEN
    UPDATE public.profiles
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = NEW.target_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Attach trigger to views table
DROP TRIGGER IF EXISTS on_view_inserted ON public.views;
CREATE TRIGGER on_view_inserted
  AFTER INSERT ON public.views
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_target_view_count();
