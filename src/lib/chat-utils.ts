// ============================================================
// Chat Utilities — Booking-based chat only
// Conversations are ONLY created when a host accepts a booking.
// ============================================================

import { supabase } from "./supabase"

/**
 * Find or create a conversation thread for a CONFIRMED booking.
 * This is called by acceptBooking() in booking-utils.ts.
 * Stores the booking_id on the conversation so the messages page
 * can show booking context (tour name, date).
 */
export async function findOrCreateChat(
  bookingId: string,
  travelerId: string,
  hostId: string
): Promise<string> {
  const [pA, pB] = [travelerId, hostId].sort()

  // 1. Check if a conversation already exists for this booking
  if (bookingId) {
    const { data: byBooking } = await supabase
      .from("conversations")
      .select("id")
      .eq("booking_id", bookingId)
      .maybeSingle()

    if (byBooking?.id) {
      return byBooking.id
    }
  }

  // 2. Check if a conversation already exists between participants (legacy)
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id")
    .or(`and(participant_a.eq.${pA},participant_b.eq.${pB}),and(participant_a.eq.${pB},participant_b.eq.${pA})`)
    .maybeSingle()

  if (existingConv?.id) {
    // Attach booking_id to the existing conversation if not already set
    if (bookingId) {
      await supabase
        .from("conversations")
        .update({ booking_id: bookingId })
        .eq("id", existingConv.id)
        .is("booking_id", null)
    }
    return existingConv.id
  }

  // 3. Create new conversation thread with booking_id
  const insertPayload: Record<string, any> = {
    participant_a: pA,
    participant_b: pB,
    last_message: "Booking confirmed — start chatting!",
    last_message_at: new Date().toISOString(),
  }

  if (bookingId) {
    insertPayload.booking_id = bookingId
  }

  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert(insertPayload)
    .select("id")
    .single()

  if (error) {
    throw new Error(`Failed to create chat: ${error.message}`)
  }

  return newConv.id
}


/**
 * Send a system message to a conversation thread.
 * Used for booking_request, booking_confirmed, booking_declined cards.
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
