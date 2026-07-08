-- 1. Add likes to journal_entries
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS likes integer NOT NULL DEFAULT 0;

-- 2. Add views to tours
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

-- 3. Add status_history to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status_history jsonb DEFAULT '[]'::jsonb;

-- 4. Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Permissive policies for demo app actions
CREATE POLICY "Allow read access to comments for anyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow insert access to comments for anyone" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete access to comments for anyone" ON public.comments FOR DELETE USING (true);

-- Permissions
GRANT SELECT, INSERT, DELETE ON public.comments TO anon, authenticated;

-- Initialize status history for existing bookings
UPDATE public.bookings
SET status_history = jsonb_build_array(
  jsonb_build_object('status', 'pending', 'timestamp', created_at),
  jsonb_build_object('status', status, 'timestamp', updated_at)
)
WHERE jsonb_array_length(status_history) = 0 OR status_history IS NULL;

-- Enable Realtime replication for dynamic updates on new/updated tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tours;
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_updates;
