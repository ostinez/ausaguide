-- Add likes column to journal_entries
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS likes integer NOT NULL DEFAULT 0;

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.journal_entries(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Enable RLS
ALTER TABLE public.comments enable row level security;

-- Policies for comments
CREATE POLICY "Allow read access to comments for anyone" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to comments for authenticated users" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Allow delete access to comments for authors" ON public.comments
  FOR DELETE USING (auth.uid() = author_id);

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO anon, authenticated;
