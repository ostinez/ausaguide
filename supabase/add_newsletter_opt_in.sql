-- Migration: Add newsletter_opt_in column to profiles table
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS newsletter_opt_in BOOLEAN DEFAULT false;

-- Create an index for efficient filtering when sending newsletters
CREATE INDEX IF NOT EXISTS idx_profiles_newsletter_opt_in 
  ON profiles (newsletter_opt_in) 
  WHERE newsletter_opt_in = true;

-- Backfill from newsletter_subscribers table if it exists
-- (Matches existing subscribers to their profiles)
UPDATE profiles p
SET newsletter_opt_in = true
FROM newsletter_subscribers ns
WHERE lower(p.email) = lower(ns.email);
