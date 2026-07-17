-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access so all users can verify maintenance mode, stripe mode, and smart contracts
CREATE POLICY "Public read system_settings" 
  ON public.system_settings FOR SELECT 
  USING (true);

-- Allow admins to manage system settings
CREATE POLICY "Admins manage system_settings" 
  ON public.system_settings FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant permissions to anonymouse and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO anon, authenticated;

-- Seed default values
INSERT INTO public.system_settings (key, value) VALUES
  ('system_maintenance_mode', 'false'),
  ('system_commission_rate', '10'),
  ('system_stripe_mode', 'test'),
  ('system_didit_address', '0x44Fe8507be060C9e84C1C4a4237dFeBE6FA8a83f')
ON CONFLICT (key) DO NOTHING;
