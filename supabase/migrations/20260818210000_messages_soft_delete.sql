-- ================================================================
-- Migration: Add Soft Delete Support to Messages
-- ================================================================

-- 1. Add soft delete columns to messages
ALTER TABLE IF EXISTS public.messages 
  ADD COLUMN IF NOT EXISTS deleted_for_traveler BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_for_host BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_by_users UUID[] DEFAULT '{}';

-- 2. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_deleted_traveler ON public.messages(deleted_for_traveler);
CREATE INDEX IF NOT EXISTS idx_messages_deleted_host ON public.messages(deleted_for_host);
