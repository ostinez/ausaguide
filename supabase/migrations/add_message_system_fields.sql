-- Add system message support to messages table
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add check constraint separately (some Postgres versions need this)
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_sender_type_check;

ALTER TABLE messages
  ADD CONSTRAINT messages_sender_type_check
  CHECK (sender_type IN ('user', 'system'));
