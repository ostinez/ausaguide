-- Create the avatars bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable public/anonymous read access (SELECT) on objects in avatars bucket
CREATE POLICY "Allow public select on avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Enable public/anonymous upload (INSERT) access on objects in avatars bucket
CREATE POLICY "Allow public insert on avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- Enable public/anonymous update (UPDATE) access on objects in avatars bucket
CREATE POLICY "Allow public update on avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

-- Enable public/anonymous delete (DELETE) access on objects in avatars bucket
CREATE POLICY "Allow public delete on avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');
