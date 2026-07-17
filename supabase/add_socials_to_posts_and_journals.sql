-- Migration: Add social links (Instagram, TikTok, Facebook, Reddit) to posts and journals tables
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Add social columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tiktok TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reddit TEXT;

-- Add social columns to journals table
ALTER TABLE journals ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS tiktok TEXT;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS reddit TEXT;
