// ============================================================
// Daily.co Video Room Integration — Strictly ONE Deterministic Room
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
 * Creates or retrieves a deterministic Daily.co room so both host and traveler
 * always enter the exact same room, preventing split empty rooms.
 */
export async function createDailyRoom(roomIdentifier: string): Promise<DailyRoom> {
  const sanitized = roomIdentifier
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 30)

  const roomName = `ausaguide-${sanitized}`
  const fallbackUrl = `https://ausaguide.daily.co/${roomName}`

  if (!DAILY_API_KEY) {
    return {
      id: roomName,
      name: roomName,
      url: fallbackUrl,
      created_at: new Date().toISOString(),
    }
  }

  try {
    const exp = Math.floor(Date.now() / 1000) + 86400 * 30 // 30 days validity

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

    if (response.ok) {
      const data = await response.json()
      return {
        id: data.id || data.name,
        name: data.name,
        url: data.url || fallbackUrl,
        created_at: data.created_at || new Date().toISOString(),
      }
    }

    // If room already exists on Daily.co (HTTP 400 or duplicate name)
    if (response.status === 400) {
      try {
        const getRes = await fetch(`${DAILY_API_BASE}/rooms/${roomName}`, {
          headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
        })
        if (getRes.ok) {
          const existingData = await getRes.json()
          return {
            id: existingData.id || existingData.name,
            name: existingData.name,
            url: existingData.url || fallbackUrl,
            created_at: existingData.created_at || new Date().toISOString(),
          }
        }
      } catch (_) {}
    }

    return {
      id: roomName,
      name: roomName,
      url: fallbackUrl,
      created_at: new Date().toISOString(),
    }
  } catch (err) {
    console.warn("[createDailyRoom] Network issue, using deterministic URL:", err)
    return {
      id: roomName,
      name: roomName,
      url: fallbackUrl,
      created_at: new Date().toISOString(),
    }
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
 * Creates or retrieves a persistent Daily.co room for a booking.
 */
export async function createOrGetDailyRoom(bookingId: string): Promise<string> {
  // 1. Check if the booking already has a stored room URL
  const { data: existing, error: fetchError } = await supabase
    .from("bookings")
    .select("daily_room_url, daily_room_id, tour:tours(title)")
    .eq("id", bookingId)
    .maybeSingle()

  if (!fetchError && existing?.daily_room_url) {
    return existing.daily_room_url as string
  }

  // 2. Create deterministic room tied to booking ID
  const cleanId = bookingId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16)
  const room = await createDailyRoom(`bk-${cleanId}`)

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
 * Creates or retrieves the single deterministic Daily.co room for a conversation thread.
 * Both host and traveler calling this will ALWAYS get the exact same room URL.
 */
export async function createGeneralDailyRoom(conversationId: string): Promise<string> {
  try {
    // 1. Check if a daily_room_url was already shared in this conversation's messages
    const { data: existingMsg } = await supabase
      .from("messages")
      .select("metadata")
      .eq("conversation_id", conversationId)
      .eq("notification_type", "daily_room_shared")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingMsg?.metadata?.daily_room_url) {
      return existingMsg.metadata.daily_room_url as string
    }
  } catch (e) {
    console.warn("Could not check existing room in messages:", e)
  }

  // 2. Generate strictly deterministic room name from conversation ID
  const cleanId = conversationId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20)
  const room = await createDailyRoom(`conv-${cleanId}`)
  return room.url
}
