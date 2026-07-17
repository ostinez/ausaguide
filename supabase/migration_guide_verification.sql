-- Guide Verification System Migration
-- Run this in the Supabase SQL editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tra_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kpsga_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS license_expiry DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_guide BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rejected_as_guide BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certificate_url TEXT;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_tra_number ON profiles(tra_number);
CREATE INDEX IF NOT EXISTS idx_profiles_verified_guide ON profiles(verified_guide);
