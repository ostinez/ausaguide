-- ============================================================================
-- Storage buckets: avatars + tour-images
-- Fixes "Bucket not found" on profile photo and tour image uploads.
-- Files are stored at <bucket>/<auth.uid()>/<file> so RLS can scope writes.
-- ============================================================================

-- 1. Buckets (public read, 5MB/20MB caps, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',     'avatars',     true, 5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic']),
  ('tour-images', 'tour-images', true, 20971520, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic'])
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Remove legacy over-permissive avatar policies (allowed anonymous writes)
DROP POLICY IF EXISTS "Allow public select on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on avatars" ON storage.objects;

-- Make re-runs idempotent
DROP POLICY IF EXISTS "Public can view avatars and tour images"     ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own image folder"  ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images"           ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images"           ON storage.objects;

-- 3. Public read
CREATE POLICY "Public can view avatars and tour images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('avatars', 'tour-images'));

-- 4. Authenticated users may upload only into their own folder
CREATE POLICY "Users can upload to their own image folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('avatars', 'tour-images')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Owners may update / delete their own objects
--    (owner check also covers legacy root-level files uploaded before this migration)
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('avatars', 'tour-images')
  AND (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text)
)
WITH CHECK (
  bucket_id IN ('avatars', 'tour-images')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('avatars', 'tour-images')
  AND (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text)
);
