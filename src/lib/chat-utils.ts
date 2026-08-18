// ============================================================
// Chat Utilities
// ============================================================

import { supabase } from "./supabase"

/**
 * Find or create a conversation thread for a booking / participants
 */
export async function findOrCreateChat(
  _bookingId: string,
  travelerId: string,
  hostId: string
): Promise<string> {
  const [pA, pB] = [travelerId, hostId].sort()

  // 1. Check if conversation already exists between participants
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id")
    .or(`and(participant_a.eq.${pA},participant_b.eq.${pB}),and(participant_a.eq.${pB},participant_b.eq.${pA})`)
    .maybeSingle()

  if (existingConv?.id) {
    return existingConv.id
  }

  // 2. Create new conversation thread
  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert({
      participant_a: pA,
      participant_b: pB,
      last_message: "New booking request",
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (error) {
    throw new Error(`Failed to create chat: ${error.message}`)
  }

  return newConv.id
}

/**
 * Find or create a direct chat between traveler and host (without requiring a booking)
 */
export async function findOrCreateDirectChat(
  travelerId: string,
  hostId: string
): Promise<string> {
  return findOrCreateChat("", travelerId, hostId)
}


/**
 * Send a system message to a conversation thread
 */
export async function sendSystemMessage(
  chatId: string,
  notificationType: "booking_request" | "booking_confirmed" | "booking_declined" | "daily_room_shared",
  content: any
): Promise<void> {
  const summaryText =
    content.message ||
    (notificationType === "booking_request"
      ? `🆕 New booking request for ${content.tour_name || "tour"}`
      : notificationType === "booking_confirmed"
      ? `✅ Booking confirmed for ${content.tour_name || "tour"} 🎉`
      : notificationType === "booking_declined"
      ? `❌ Booking declined for ${content.tour_name || "tour"}`
      : `📹 Video room created`)

  const { error } = await supabase.from("messages").insert({
    conversation_id: chatId,
    sender_id: null,
    sender_type: "system",
    notification_type: notificationType,
    message: summaryText,
    metadata: {
      ...content,
      type: notificationType,
    },
    read: false,
  })

  if (error) {
    console.error("Failed to send system message:", error)
    // Non-blocking fallback if custom columns differ
    try {
      await supabase.from("messages").insert({
        conversation_id: chatId,
        sender_type: "system",
        message: summaryText,
        metadata: { ...content, type: notificationType },
      })
    } catch (_) {}
  }

  // Update conversation last_message
  try {
    await supabase
      .from("conversations")
      .update({
        last_message: summaryText.substring(0, 120),
        last_message_at: new Date().toISOString(),
      })
      .eq("id", chatId)
  } catch (_) {}
}
