-- Create posts private storage bucket with size and MIME filters
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts', 
  'posts', 
  false, 
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = false, 
    file_size_limit = 5242880, 
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage policies for posts bucket
CREATE POLICY "Users upload own posts images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'posts' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone authenticated read posts images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'posts'
  );

CREATE POLICY "Users delete own posts images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'posts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
