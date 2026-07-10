import { supabase } from "@/lib/supabase"
import { createNotification } from "@/lib/api/notifications"
import { RateLimitError } from "@/lib/rate-limiter"
import { checkRateLimit, getBookingKey } from "@/lib/api/rate-limit"
import { trackEvent } from "@/lib/posthog"
import type { Booking, Tour, Profile, TourCategory, TourType, BookingStatus } from "@/lib/types"
import type { BookingRow, TourRow, ProfileRow } from "@/lib/database.types"
import { sendBookingRequestEmail, sendBookingConfirmationEmail } from "@/lib/api/emails"

// ── Input type for creating a new booking ────────────────────────────────────

export interface CreateBookingInput {
  tour_id: string
  host_id: string
  booking_date: string       // ISO date string "YYYY-MM-DD"
  guest_count: number
  total_price: number
  guest_name: string
  guest_email: string
  guest_phone: string
  notes?: string
  booking_time?: string
  guest_id?: string
  booking_type?: 'physical' | 'virtual'
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeTourType(type: string): TourType {
  return type === "virtual" ? "virtual" : "in_person"
}

function mapProfile(row: ProfileRow): Profile {
  const now = new Date().toISOString()
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    role: row.role,
    bio: row.bio,
    location: row.location,
    phone: row.phone,
    languages: row.languages ?? [],
    host_type: row.host_type ?? null,
    is_verified: row.is_verified ?? false,
    created_at: row.created_at ?? now,
    updated_at: row.updated_at ?? now,
  }
}

function mapTourRow(row: TourRow): Tour {
  const now = row.created_at ?? new Date().toISOString()
  return {
    id: row.id,
    host_id: row.host_id,
    title: row.title,
    description: row.description,
    short_description: row.short_description,
    price: Number(row.price),
    currency: row.currency,
    duration_hours: Number(row.duration_hours),
    max_guests: row.max_guests,
    location_name: row.location_name,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    category: row.category as TourCategory,
    tour_type: normalizeTourType(row.tour_type),
    images: row.images ?? [],
    highlights: row.highlights ?? [],
    is_published: row.is_published,
    rating: Number(row.rating),
    review_count: row.review_count,
    views: Number((row as any).views ?? 0),
    created_at: now,
    updated_at: row.updated_at ?? now,
  }
}

function mapBooking(
  row: BookingRow & {
    tour?: (TourRow & { host?: ProfileRow | null }) | null
    host?: ProfileRow | null
  }
): Booking {
  const now = row.created_at ?? new Date().toISOString()
  const tourRow = row.tour
  const hostProfile = row.host ?? tourRow?.host

  return {
    id: row.id,
    tour_id: row.tour_id,
    guest_id: row.guest_id ?? "",
    host_id: row.host_id,
    booking_date: row.booking_date,
    check_in_date: row.check_in_date,
    check_out_date: row.check_out_date,
    guest_count: row.guest_count,
    status: row.status,
    total_price: Number(row.total_price),
    booking_type: (row as any).booking_type,
    stripe_payment_intent_id: row.stripe_payment_intent_id,
    daily_room_url: row.daily_room_url,
    guest_name: row.guest_name,
    guest_email: row.guest_email,
    guest_phone: row.guest_phone,
    notes: row.notes,
    booking_time: row.booking_time,
    decline_reason: (row as any).decline_reason,
    status_history: (row as any).status_history ?? [],
    created_at: now,
    updated_at: row.updated_at ?? now,
    tour: tourRow ? mapTourRow(tourRow) : undefined,
    host: hostProfile ? mapProfile(hostProfile) : undefined,
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Insert a new booking row and return the created Booking.
 */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  // ── Rate limit: 10 booking requests per minute per user ──────────────────
  const rateLimitKey = getBookingKey(input.guest_id ?? input.guest_email)
  const limitResult = await checkRateLimit(rateLimitKey, { max: 10, windowMs: 60000 })
  if (!limitResult.allowed) {
    const retryAfter = Math.ceil((limitResult.resetAt.getTime() - Date.now()) / 1000)
    console.warn("Booking rate limit exceeded:", {
      error: "Too many requests. Please wait a moment.",
      retryAfter
    })
    throw new RateLimitError()
  }

  // 1. Fetch tour details (max_guests and title)
  const { data: tourData, error: tourError } = await supabase
    .from("tours")
    .select("title, max_guests")
    .eq("id", input.tour_id)
    .maybeSingle()

  if (tourError) throw tourError
  const maxGuests = tourData?.max_guests ?? 1
  const tourTitle = tourData?.title ?? "your tour"

  // 2. Fetch existing bookings for this tour and date
  const { data: existingBookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("guest_count, booking_time")
    .eq("tour_id", input.tour_id)
    .eq("booking_date", input.booking_date)
    .in("status", ["confirmed", "pending"])

  if (bookingsError) throw bookingsError

  // 3. Filter by slot time
  const inputTime = input.booking_time ? input.booking_time.substring(0, 5) : ""
  const totalGuestsBooked = (existingBookings ?? [])
    .filter(b => {
      const bTime = b.booking_time ? b.booking_time.substring(0, 5) : ""
      return bTime === inputTime
    })
    .reduce((sum, b) => sum + (b.guest_count || 0), 0)

  // 4. Validate capacity
  if (totalGuestsBooked + input.guest_count > maxGuests) {
    throw new Error("This tour is fully booked for this time slot")
  }

  // 5. Insert new booking with pending status
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      tour_id: input.tour_id,
      host_id: input.host_id,
      guest_id: input.guest_id || null,
      booking_date: input.booking_date,
      guest_count: input.guest_count,
      total_price: input.total_price,
      status: "pending",
      guest_name: input.guest_name,
      guest_email: input.guest_email,
      guest_phone: input.guest_phone,
      notes: input.notes ?? null,
      booking_time: input.booking_time ?? null,
    })
    .select("*")
    .single()

  if (error) throw error

  // 6. Create alert notification for host
  try {
    await createNotification(
      input.host_id,
      `New booking from ${input.guest_name} for ${tourTitle}`,
      "booking_request",
      data.id
    )

    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", input.host_id)
      .maybeSingle()

    if (hostProfile?.email) {
      sendBookingRequestEmail(
        hostProfile.email,
        hostProfile.full_name,
        input.guest_name,
        tourTitle,
        input.booking_date
      ).catch(err => console.error("Failed to send booking request email:", err))
    }
  } catch (notifErr) {
    console.error("Failed to process booking creation notifications:", notifErr)
  }

  return mapBooking(data as BookingRow)
}

/**
 * Fetch a single booking by ID, joining the tour and host profile.
 */
export async function fetchBookingById(id: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      tour:tours (
        *,
        host:profiles (*)
      ),
      host:profiles!bookings_host_id_fkey (*)
    `)
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapBooking(
    data as BookingRow & {
      tour?: (TourRow & { host?: ProfileRow | null }) | null
      host?: ProfileRow | null
    }
  )
}

/**
 * Update the status of a booking.
 */
export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  declineReason?: string
): Promise<Booking> {
  // 1. Fetch current status_history & created_at
  const { data: current, error: fetchError } = await supabase
    .from("bookings")
    .select("status_history, created_at")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) throw fetchError

  let currentHistory: any[] = []
  if (current) {
    if (Array.isArray(current.status_history)) {
      currentHistory = [...current.status_history]
    } else {
      currentHistory = [
        { status: "pending", timestamp: current.created_at || new Date().toISOString() }
      ]
    }
  }

  // 2. Append new status change
  currentHistory.push({
    status: status,
    timestamp: new Date().toISOString()
  })

  // 3. Update database
  const { data, error } = await supabase
    .from("bookings")
    .update({ 
      status,
      status_history: currentHistory,
      ...(declineReason ? { decline_reason: declineReason } : {})
    })
    .eq("id", id)
    .select(`
      *,
      tour:tours (
        *,
        host:profiles (*)
      )
    `)
    .single()

  if (error) throw error

  try {
    const booking = mapBooking(data as BookingRow & { tour?: (TourRow & { host?: ProfileRow | null }) | null })
    const travelerId = booking.guest_id

    let message = ""
    let type: "booking_request" | "booking_accepted" | "booking_declined" | "booking_completed" | "new_message" = "booking_request"

    if (status === "confirmed") {
      message = "Host accepted your booking"
      type = "booking_accepted"
      trackEvent("booking_created", {
        booking_id: id,
        tour_id: booking.tour_id,
        host_id: booking.host_id,
        guest_id: booking.guest_id,
        total_price: booking.total_price,
      })
    } else if (status === "declined") {
      message = "Host declined your booking"
      type = "booking_declined"
    } else if (status === "completed") {
      message = "Tour complete! Leave a review"
      type = "booking_completed"
    }

    if (message && travelerId) {
      await createNotification(travelerId, message, type, id)
    }

    if (status === "confirmed" && booking.guest_email) {
      sendBookingConfirmationEmail(
        booking.guest_email,
        booking.guest_name,
        booking.tour?.title || "your tour",
        booking.booking_date,
        `${booking.tour?.currency || 'KES'} ${booking.total_price.toLocaleString()}`
      ).catch(err => console.error("Failed to send booking confirmation email:", err))
    }
  } catch (notifErr) {
    console.error("Failed to insert status notification:", notifErr)
  }

  return mapBooking(data as BookingRow & { tour?: TourRow | null })
}
