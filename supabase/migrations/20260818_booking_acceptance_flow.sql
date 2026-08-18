-- ============================================================
-- BOOKING ACCEPTANCE FLOW — CHAT-BASED APPROVAL
-- ============================================================

-- 1. Update bookings status check to include 'awaiting_confirmation'
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'awaiting_confirmation', 'confirmed', 'cancelled', 'completed', 'checked_in', 'declined'));

-- 2. Add daily_room_id and daily_room_url columns for video calls
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS daily_room_id TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS daily_room_url TEXT;

-- 3. Add decline_reason column (if not already added)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- 4. Add notification_type and metadata columns to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS notification_type TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'user';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_status_awaiting ON public.bookings(status) WHERE status = 'awaiting_confirmation';
CREATE INDEX IF NOT EXISTS idx_bookings_decline_reason ON public.bookings(decline_reason) WHERE decline_reason IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_notification_type ON public.messages(notification_type);

-- 6. Add status_history column if not present
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;
