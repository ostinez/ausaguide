// ============================================================
// Daily.co Video Room Integration
// ============================================================

import { supabase } from "@/lib/supabase"

const DAILY_API_KEY = (import.meta.env?.VITE_DAILY_API_KEY as string | undefined) || ""
const DAILY_API_BASE = "https://api.daily.co/v1"


export interface DailyRoom {
  id: string
  name: string
  url: string
  created_at?: string
}

function requireDailyKey(): string {
  if (!DAILY_API_KEY) {
    throw new Error(
      "Daily.co API key is not configured. Please add VITE_DAILY_API_KEY to your environment variables."
    )
  }
  return DAILY_API_KEY
}

/**
 * Create a new Daily.co video room for a booking or tour
 */
export async function createDailyRoom(tourName: string): Promise<DailyRoom> {
  const sanitized = tourName.toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 20)
  const roomName = `ausaguide-${sanitized}-${Date.now().toString().slice(-6)}`

  if (!DAILY_API_KEY) {
    console.warn("Daily.co API key not configured. Using generated room URL.")
    return {
      id: roomName,
      name: roomName,
      url: `https://ausaguide.daily.co/${roomName}`,
      created_at: new Date().toISOString(),
    }
  }

  const exp = Math.floor(Date.now() / 1000) + 86400 * 7 // 7 days expiry

  const response = await fetch(`${DAILY_API_BASE}/rooms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "public",
      properties: {
        enable_chat: true,
        enable_screenshare: true,
        start_audio_off: false,
        start_video_off: false,
        max_participants: 10,
        exp,
      },
    }),
  })

  if (!response.ok) {
    console.warn(`Daily.co API error: ${response.status}. Using fallback room URL.`)
    return {
      id: roomName,
      name: roomName,
      url: `https://ausaguide.daily.co/${roomName}`,
      created_at: new Date().toISOString(),
    }
  }

  const data = await response.json()
  return {
    id: data.id || data.name,
    name: data.name,
    url: data.url,
    created_at: data.created_at || new Date().toISOString(),
  }
}

/**
 * Get a room by ID/Name
 */
export async function getDailyRoom(roomId: string): Promise<DailyRoom> {
  const apiKey = requireDailyKey()

  const response = await fetch(`${DAILY_API_BASE}/rooms/${roomId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Daily.co room: ${response.statusText}`)
  }

  const data = await response.json()
  return {
    id: data.id || data.name,
    name: data.name,
    url: data.url,
    created_at: data.created_at,
  }
}

/**
 * Creates a Daily.co room for a booking, stores the URL in Supabase,
 * and returns the room URL.
 */
export async function createOrGetDailyRoom(bookingId: string): Promise<string> {
  // 1. Check if the booking already has a room URL
  const { data: existing, error: fetchError } = await supabase
    .from("bookings")
    .select("daily_room_url, daily_room_id, tour:tours(title)")
    .eq("id", bookingId)
    .maybeSingle()

  if (!fetchError && existing?.daily_room_url) {
    return existing.daily_room_url as string
  }

  // 2. Create room
  const tourTitle = (existing as any)?.tour?.title || "Tour"
  const room = await createDailyRoom(tourTitle)

  // 3. Persist in bookings table
  await supabase
    .from("bookings")
    .update({
      daily_room_url: room.url,
      daily_room_id: room.id,
    })
    .eq("id", bookingId)

  return room.url
}

/**
 * Creates a general two-participant Daily.co room for DMs.
 */
export async function createGeneralDailyRoom(conversationId: string): Promise<string> {
  const room = await createDailyRoom(`dm-${conversationId.slice(0, 8)}`)
  return room.url
}
