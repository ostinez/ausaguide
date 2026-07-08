import { supabase } from "@/lib/supabase"
import type { Booking, HostType, Profile, Tour, TourCategory, TourType } from "@/lib/types"
import type { BookingRow, ProfileRow, TourRow } from "@/lib/database.types"

export interface HostApplicationInput {
  user_id: string
  full_name: string
  email: string
  city: string
  host_type: HostType
  bio: string
  id_upload_url?: string | null
  license_upload_url?: string | null
}

export interface HostRecord {
  id: string
  user_id: string | null
  full_name: string
  email: string
  city: string
  host_type: HostType
  bio: string
  id_upload_url: string | null
  license_upload_url: string | null
  rejection_reason: string | null
  status: string
  created_at: string
  reviewed_at: string | null
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

function normalizeTourType(type: string): TourType {
  return type === "virtual" ? "virtual" : "in_person"
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
    created_at: now,
    updated_at: row.updated_at ?? now,
  }
}

function mapBooking(row: BookingRow & { tour?: TourRow | null }): Booking {
  const now = row.created_at ?? new Date().toISOString()
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
    stripe_payment_intent_id: row.stripe_payment_intent_id,
    daily_room_url: row.daily_room_url,
    guest_name: row.guest_name,
    guest_email: row.guest_email,
    guest_phone: row.guest_phone,
    notes: row.notes,
    booking_time: (row as any).booking_time,
    decline_reason: (row as any).decline_reason,
    created_at: now,
    updated_at: row.updated_at ?? now,
    tour: row.tour ? mapTourRow(row.tour) : undefined,
  }
}

export async function fetchHostProfiles(limit = 6): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "host")
    .order("full_name")
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(mapProfile)
}

export async function submitHostApplication(
  application: HostApplicationInput
): Promise<void> {
  const applicationBio = [
    application.bio,
    "",
    `Applicant: ${application.full_name}`,
    `Email: ${application.email}`,
    `City: ${application.city}`,
  ]
    .filter(Boolean)
    .join("\n")

  const { error } = await supabase.from("hosts").insert({
    user_id: application.user_id,
    full_name: application.full_name,
    email: application.email,
    city: application.city,
    host_type: application.host_type,
    bio: applicationBio,
    id_upload_url: application.id_upload_url ?? null,
    license_upload_url: application.license_upload_url ?? null,
    status: "pending",
  })

  if (error) throw error
}

export async function fetchProfileByRole(
  role: "host" | "traveler" | "admin"
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", role)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? mapProfile(data) : null
}

export async function fetchHostByUserId(userId: string): Promise<HostRecord | null> {
  const { data, error } = await supabase
    .from("hosts")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as HostRecord | null
}

export async function fetchBookingsByHostId(hostId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
        *,
        tour:tours (
          *
        )
      `
    )
    .eq("host_id", hostId)
    .order("booking_date", { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => mapBooking(row as BookingRow & { tour?: TourRow | null }))
}

export async function fetchBookingsByGuestId(guestId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
        *,
        tour:tours (
          *
        )
      `
    )
    .eq("guest_id", guestId)
    .order("booking_date", { ascending: true })
    .limit(10)

  if (error) throw error
  return (data ?? []).map((row) => mapBooking(row as BookingRow & { tour?: TourRow | null }))
}

/* ─────────────────── Admin API ─────────────────── */

export async function fetchAllHostApplications(): Promise<HostRecord[]> {
  const { data, error } = await supabase
    .from("hosts")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as HostRecord[]
}

export async function fetchProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) throw error
  return data ? mapProfile(data) : null
}

export async function approveHost(hostId: string): Promise<void> {
  // 1. Get host details
  const { data: hostApp, error: fetchError } = await supabase
    .from("hosts")
    .select("user_id, host_type, bio, city")
    .eq("id", hostId)
    .single()

  if (fetchError) throw fetchError

  // 2. Update host application status
  const { error: updateHostError } = await supabase
    .from("hosts")
    .update({
      status: "approved" as const,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", hostId)

  if (updateHostError) throw updateHostError

  // 3. Sync to profiles table
  if (hostApp && hostApp.user_id) {
    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        role: "host",
        host_type: hostApp.host_type,
        is_verified: true,
        bio: hostApp.bio,
        location: hostApp.city,
      })
      .eq("id", hostApp.user_id)

    if (updateProfileError) throw updateProfileError
  }
}

export async function rejectHost(hostId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from("hosts")
    .update({
      status: "rejected" as const,
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", hostId)

  if (error) throw error
}

export async function updateProfile(
  userId: string,
  profile: {
    full_name?: string
    bio?: string | null
    location?: string | null
    languages?: string[]
    host_type?: string | null
    phone?: string | null
    avatar_url?: string | null
  }
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(profile)
    .eq("id", userId)

  if (error) throw error
}

export interface HostSettings {
  host_id: string
  reminder_time: number
  notification_preferences: string[]
  is_busy: boolean
  busy_reason: string | null
  updated_at: string | null
}

export async function fetchHostSettings(hostId: string): Promise<HostSettings | null> {
  const { data, error } = await supabase
    .from('host_settings')
    .select('*')
    .eq('host_id', hostId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error fetching host settings:', error)
    return null
  }

  return data
}

export async function updateHostSettings(
  hostId: string,
  settings: {
    reminder_time?: number;
    notification_preferences?: string[];
    is_busy?: boolean;
    busy_reason?: string;
  }
): Promise<void> {
  // Build and log the full payload
  const payload = {
    host_id: hostId,
    reminder_time: settings.reminder_time ?? 30,
    notification_preferences: settings.notification_preferences ?? ['email', 'in_app'],
    is_busy: settings.is_busy ?? false,
    busy_reason: settings.busy_reason ?? null,
    updated_at: new Date().toISOString()
  }
  console.log('[updateHostSettings] Full request payload:', payload)

  const { error } = await supabase
    .from('host_settings')
    .upsert(payload, { onConflict: 'host_id' })

  // Log the full Supabase error response
  if (error) {
    console.error('[updateHostSettings] Supabase error response:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    throw error
  }

  console.log('[updateHostSettings] Settings saved successfully for host_id:', hostId)
}

