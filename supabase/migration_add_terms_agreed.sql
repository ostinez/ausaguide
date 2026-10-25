-- ============================================================
-- migration_add_terms_agreed.sql
-- Add terms_agreed columns to profiles for compliance tracking
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_agreed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_agreed_at timestamptz;
