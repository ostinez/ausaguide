// ============================================================
// Booking Utilities — Chat Approval Flow
// ============================================================

import { supabase } from "./supabase"
import { findOrCreateChat, sendSystemMessage } from "./chat-utils"
import { createDailyRoom } from "./daily"
import { sendBookingConfirmationEmail } from "./api/emails"

export interface BookingRequest {
  tourId: string
  travelerId: string
  hostId: string
  amount: number
  currency: string
  date: string
  time?: string
  participants: number
  tourTitle: string
  travelerName: string
  travelerEmail?: string
  travelerPhone?: string
  notes?: string
}

/**
 * Create a booking with 'awaiting_confirmation' status
 * Called after checkout / payment initiation
 */
export async function createBookingWithRequest(data: BookingRequest) {
  // 1. Insert booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      tour_id: data.tourId,
      guest_id: data.travelerId,
      host_id: data.hostId,
      total_price: data.amount,
      currency: data.currency || "KES",
      status: "awaiting_confirmation",
      booking_date: data.date,
      booking_time: data.time || null,
      guest_count: data.participants || 1,
      guest_name: data.travelerName,
      guest_email: data.travelerEmail || "",
      guest_phone: data.travelerPhone || "",
      notes: data.notes || null,
      tour_type: "physical",
    })
    .select("*, tour:tours(title)")
    .single()

  if (bookingError) {
    throw new Error(`Failed to create booking: ${bookingError.message}`)
  }

  // 2. Find or create chat
  const chatId = await findOrCreateChat(
    booking.id,
    data.travelerId,
    data.hostId
  )

  // 3. Send booking request message into the conversation
  await sendSystemMessage(
    chatId,
    "booking_request",
    {
      booking_id: booking.id,
      tour_name: data.tourTitle,
      traveler_name: data.travelerName,
      date: data.date,
      time: data.time || "Flexible",
      guests: data.participants || 1,
      amount: data.amount,
      currency: data.currency || "KES",
      status: "awaiting_confirmation",
      message: `🆕 New booking request from ${data.travelerName} for ${data.tourTitle}`,
    }
  )

  return { booking, chatId }
}

/**
 * Accept a booking — host clicks Accept in chat
 */
export async function acceptBooking(bookingId: string, hostId: string) {
  // 1. Fetch booking details
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("*, tour:tours(title, host_id)")
    .eq("id", bookingId)
    .single()

  if (fetchError || !booking) throw new Error("Booking not found")
  if (booking.host_id !== hostId) throw new Error("Unauthorized: you are not the host for this booking")

  const tourTitle = (booking as any)?.tour?.title || "Tour"
  const travelerId = booking.guest_id

  // 2. Create Daily.co room for live connection
  let dailyRoom: { id: string; url: string; name: string } | null = null
  try {
    dailyRoom = await createDailyRoom(tourTitle)
  } catch (err) {
    console.warn("[acceptBooking] Daily room creation notice:", err)
  }

  // 3. Update booking status to confirmed
  const { data: updatedBooking, error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      daily_room_url: dailyRoom?.url || booking.daily_room_url || null,
      daily_room_id: dailyRoom?.id || booking.daily_room_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .select("*, tour:tours(title)")
    .single()

  if (updateError) throw new Error(`Failed to update booking: ${updateError.message}`)

  // 4. Find or create conversation
  if (travelerId && hostId) {
    const chatId = await findOrCreateChat(bookingId, travelerId, hostId)

    // 5. Send confirmation message to chat
    await sendSystemMessage(
      chatId,
      "booking_confirmed",
      {
        booking_id: bookingId,
        tour_name: tourTitle,
        daily_room_url: dailyRoom?.url || null,
        daily_room_id: dailyRoom?.id || null,
        message: `🎉 Your booking for "${tourTitle}" has been confirmed by the host! Get ready for an amazing experience.`,
      }
    )
  }

  // 6. Send confirmation email
  if (booking.guest_email) {
    sendBookingConfirmationEmail(
      booking.guest_email,
      booking.guest_name,
      tourTitle,
      booking.booking_date,
      `${booking.currency || "KES"} ${booking.total_price?.toLocaleString() || "0"}`
    ).catch((err) => console.error("Failed to send booking confirmation email:", err))
  }

  return { booking: updatedBooking, dailyRoom }
}

/**
 * Decline a booking — host clicks Decline in chat
 */
export async function declineBooking(
  bookingId: string,
  hostId: string,
  declineReason: string
) {
  // 1. Fetch booking details
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("*, tour:tours(title, host_id)")
    .eq("id", bookingId)
    .single()

  if (fetchError || !booking) throw new Error("Booking not found")
  if (booking.host_id !== hostId) throw new Error("Unauthorized: you are not the host for this booking")

  const tourTitle = (booking as any)?.tour?.title || "Tour"
  const travelerId = booking.guest_id

  // 2. Update booking with decline reason and status
  const { data: updatedBooking, error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "declined",
      decline_reason: declineReason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .select("*, tour:tours(title)")
    .single()

  if (updateError) throw new Error(`Failed to decline booking: ${updateError.message}`)

  // 3. Find or create chat
  if (travelerId && hostId) {
    const chatId = await findOrCreateChat(bookingId, travelerId, hostId)

    // 4. Send decline message
    await sendSystemMessage(
      chatId,
      "booking_declined",
      {
        booking_id: bookingId,
        tour_name: tourTitle,
        decline_reason: declineReason,
        message: `❌ Your booking for "${tourTitle}" was declined by the host. Reason: ${declineReason}`,
      }
    )
  }

  return { booking: updatedBooking }
}
