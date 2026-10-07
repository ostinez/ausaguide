-- ── Add payout columns to profiles ──────────────────────────────────────────
-- Stores the host's M-Pesa number and preferred payout method directly on
-- their profile so settings saves persist across devices/sessions.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mpesa_phone      text,
  ADD COLUMN IF NOT EXISTS payout_method    text NOT NULL DEFAULT 'mpesa';

-- (Optional) Add social / privacy columns used by the settings page
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tiktok                      text,
  ADD COLUMN IF NOT EXISTS instagram                   text,
  ADD COLUMN IF NOT EXISTS facebook                    text,
  ADD COLUMN IF NOT EXISTS reddit                      text,
  ADD COLUMN IF NOT EXISTS is_private                  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS direct_messages_permission  text    NOT NULL DEFAULT 'everyone';
