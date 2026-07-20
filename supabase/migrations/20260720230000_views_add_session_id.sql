-- Migration: Add session_id column to views table
ALTER TABLE public.views ADD COLUMN IF NOT EXISTS session_id TEXT NOT NULL DEFAULT 'default_session';
