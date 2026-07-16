-- Migration: Multi-image posts support and Admin RLS overrides (impersonation support)

-- 1. Create image_urls column on public.posts if it doesn't exist
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}'::text[];

-- 2. Migrate existing single image_url values to the image_urls array
UPDATE public.posts 
SET image_urls = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND (image_urls IS NULL OR cardinality(image_urls) = 0);

-- 3. Create Admin RLS policies to allow admins to insert, update, and delete posts for anyone (fixes impersonation crash)
DROP POLICY IF EXISTS "Admins can manage all posts" ON public.posts;
CREATE POLICY "Admins can manage all posts"
  ON public.posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Create Admin RLS policies for journals as well
DROP POLICY IF EXISTS "Admins can manage all journals" ON public.journals;
CREATE POLICY "Admins can manage all journals"
  ON public.journals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
