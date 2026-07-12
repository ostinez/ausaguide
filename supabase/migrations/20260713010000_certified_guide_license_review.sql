-- Add license columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS license_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS license_status TEXT CHECK (license_status IN ('pending', 'approved', 'rejected'));

-- Create licenses private storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('licenses', 'licenses', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for licenses bucket
CREATE POLICY "Hosts upload own license to licenses"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'licenses' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners read own license from licenses"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'licenses' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins read any license from licenses"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'licenses'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
