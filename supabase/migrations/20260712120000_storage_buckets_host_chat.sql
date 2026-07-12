-- Create host-licenses storage bucket for certified guide license uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('host-licenses', 'host-licenses', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own license
CREATE POLICY "Hosts upload own license"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'host-licenses' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow admins (role = 'admin') to read all licenses  
CREATE POLICY "Admins read host licenses"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'host-licenses'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create chat-images bucket for messages and posts (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to chat-images
CREATE POLICY "Authenticated users upload chat images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-images');

-- Public read for chat-images (images are served publicly)
CREATE POLICY "Public read chat images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');
