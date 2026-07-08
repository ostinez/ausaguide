import { supabase } from "@/lib/supabase"
import { createNotification } from "./notifications"
import { RateLimitError } from "@/lib/rate-limiter"
import { checkRateLimit, getChatKey } from "@/lib/api/rate-limit"

export interface Message {
  id: string
  booking_id: string | null
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

export async function fetchMessages(bookingId: string, userId?: string, otherId?: string): Promise<Message[]> {
  const query = supabase
    .from("messages")
    .select("id, booking_id, sender_id, receiver_id, message, read, created_at")
    
  if (bookingId) {
    query.eq("booking_id", bookingId)
  } else if (userId && otherId) {
    query.or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
  }

  const { data, error } = await query.order("created_at", { ascending: true })

  if (error) throw error
  return (data ?? []).map((row: any) => ({
    id: row.id,
    booking_id: row.booking_id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    content: row.message,
    is_read: row.read,
    created_at: row.created_at,
  }))
}

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
  bookingId?: string
): Promise<Message> {
  const rateLimitKey = getChatKey(senderId)
  const limitResult = await checkRateLimit(rateLimitKey, { max: 30, windowMs: 60000 })
  if (!limitResult.allowed) {
    const retryAfter = Math.ceil((limitResult.resetAt.getTime() - Date.now()) / 1000)
    console.warn("Chat rate limit exceeded:", {
      error: "Too many requests. Please wait a moment.",
      retryAfter
    })
    throw new RateLimitError()
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      message: content,
      booking_id: bookingId ?? null,
      read: false,
    })
    .select("id, booking_id, sender_id, receiver_id, message, read, created_at")
    .single()

  if (error) throw error

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", senderId)
      .single()
    const senderName = profile?.full_name ?? "Someone"

    await createNotification(
      receiverId,
      `New message from ${senderName}`,
      "new_message",
      bookingId ?? null
    )
  } catch (notifErr) {
    console.warn("Failed to create message notification:", notifErr)
  }

  return {
    id: data.id,
    booking_id: data.booking_id,
    sender_id: data.sender_id,
    receiver_id: data.receiver_id,
    content: data.message,
    is_read: data.read,
    created_at: data.created_at,
  }
}

export async function markMessagesRead(userId: string, senderId: string): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .update({ read: true })
    .eq("receiver_id", userId)
    .eq("sender_id", senderId)
    .eq("read", false)

  if (error) throw error
}
