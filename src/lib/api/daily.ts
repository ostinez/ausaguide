import { supabase } from "@/lib/supabase"

const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY as string
const DAILY_API_BASE = "https://api.daily.co/v1"

export interface DailyRoom {
  url: string
  name: string
}

/**
 * Creates a Daily.co room for a booking, stores the URL in Supabase,
 * and returns the room URL.
 * - privacy: public (no token required)
 * - max_participants: 2
 * - exp: 2 hours from now
 */
export async function createOrGetDailyRoom(bookingId: string): Promise<string> {
  // 1. Check if the booking already has a room URL
  const { data: existing, error: fetchError } = await supabase
    .from("bookings")
    .select("daily_room_url")
    .eq("id", bookingId)
    .single()

  if (fetchError) throw fetchError

  if (existing?.daily_room_url) {
    return existing.daily_room_url as string
  }

  // 2. Create a new room via the Daily.co REST API
  const exp = Math.floor(Date.now() / 1000) + 2 * 60 * 60 // 2 hours from now
  const roomName = `ausaguide-${bookingId.slice(0, 8)}`

  const response = await fetch(`${DAILY_API_BASE}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "public",
      properties: {
        max_participants: 2,
        exp,
        enable_prejoin_ui: true,
        enable_knocking: false,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Daily.co API error: ${response.status} ${errorBody}`)
  }

  const room: DailyRoom = await response.json()
  const roomUrl = room.url

  // 3. Persist the room URL in the bookings table
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ daily_room_url: roomUrl })
    .eq("id", bookingId)

  if (updateError) throw updateError

  return roomUrl
}

/**
 * Creates a general two-participant Daily.co room for DMs.
 * Returns the room URL.
 */
export async function createGeneralDailyRoom(conversationId: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 2 * 60 * 60 // 2 hours from now
  const roomName = `chat-${conversationId.slice(0, 8)}-${Date.now().toString().slice(-4)}`

  const response = await fetch(`${DAILY_API_BASE}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "public",
      properties: {
        max_participants: 2,
        exp,
        enable_prejoin_ui: true,
        enable_knocking: false,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Daily.co API error: ${response.status} ${errorBody}`)
  }

  const room: DailyRoom = await response.json()
  return room.url
}

