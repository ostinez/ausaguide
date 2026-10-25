import { supabase } from "@/lib/supabase"
import type { Tour, Profile, TourCategory, TourType } from "@/lib/types"
import type { ProfileRow, TourRow } from "@/lib/database.types"

// Optimized targeted column selection for tour cards & listings
// Avoids transferring heavy unneeded columns while preserving joined host info
export const TOUR_CARD_SELECT = `
  id,
  host_id,
  title,
  short_description,
  price,
  currency,
  duration_hours,
  max_guests,
  location_name,
  latitude,
  longitude,
  category,
  tour_type,
  images,
  is_published,
  rating,
  review_count,
  views,
  physical_price,
  virtual_price,
  created_at,
  host:profiles (
    id,
    full_name,
    avatar_url,
    is_verified,
    verified_guide,
    host_tier
  )
`

// Full select for detail views and administrative editing
export const TOUR_DETAIL_SELECT = `
  *,
  host:profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    bio,
    location,
    phone,
    languages,
    host_type,
    is_verified,
    host_tier,
    verified_guide,
    rejected_as_guide,
    license_url,
    license_status,
    created_at,
    updated_at
  )
`

function mapProfile(row: Partial<ProfileRow>): Profile {
  const now = new Date().toISOString()
  return {
    id: row.id || "",
    email: row.email || "",
    full_name: row.full_name || "Local Host",
    avatar_url: row.avatar_url || null,
    role: row.role || "host",
    bio: row.bio || "",
    location: row.location || "",
    phone: row.phone || "",
    languages: row.languages ?? [],
    host_type: row.host_type ?? null,
    is_verified: row.is_verified ?? false,
    host_tier: (row as any).host_tier ?? null,
    verified_guide: (row as any).verified_guide ?? false,
    rejected_as_guide: (row as any).rejected_as_guide ?? false,
    license_url: (row as any).license_url ?? null,
    license_status: (row as any).license_status ?? null,
    created_at: row.created_at ?? now,
    updated_at: row.updated_at ?? now,
  }
}

function normalizeTourType(type?: string): TourType {
  return type === "virtual" ? "virtual" : "in_person"
}

function mapTour(
  row: Partial<TourRow> & {
    host?: Partial<ProfileRow> | null
  }
): Tour {
  const now = row.created_at ?? new Date().toISOString()
  const hostProfile = row.host

  return {
    id: row.id || "",
    host_id: row.host_id || "",
    title: row.title || "",
    description: row.description || row.short_description || "",
    short_description: row.short_description || "",
    price: Number(row.price ?? 0),
    currency: row.currency || "KES",
    duration_hours: Number(row.duration_hours ?? 1),
    max_guests: row.max_guests ?? 10,
    location_name: row.location_name || "",
    latitude: Number(row.latitude ?? -1.2921),
    longitude: Number(row.longitude ?? 36.8219),
    category: (row.category as TourCategory) || "nature",
    tour_type: normalizeTourType(row.tour_type),
    images: row.images ?? [],
    highlights: row.highlights ?? [],
    is_published: row.is_published ?? true,
    rating: Number(row.rating ?? 5),
    review_count: row.review_count ?? 0,
    availability: (row as any).availability ?? {},
    status: (row as any).status ?? (row.is_published ? "published" : "draft"),
    tags: (row as any).tags ?? [],
    views: Number((row as any).views ?? 0),
    physical_price: (row as any).physical_price ? Number((row as any).physical_price) : undefined,
    virtual_price: (row as any).virtual_price ? Number((row as any).virtual_price) : undefined,
    created_at: now,
    updated_at: row.updated_at ?? now,
    host: hostProfile ? mapProfile(hostProfile) : undefined,
  }
}

/**
 * Fetch tours with optional pagination (limit/offset) for high performance.
 * Uses targeted column selection and joins host info in a single query.
 */
export interface TourFilterOptions {
  limit?: number
  offset?: number
  search?: string
  category?: string
  location?: string
  minPrice?: number
  maxPrice?: number
}

export async function fetchTours(options?: TourFilterOptions): Promise<Tour[]> {
  let query = supabase
    .from("tours")
    .select(TOUR_CARD_SELECT)
    .eq("is_published", true)
    .order("created_at", { ascending: false })

  if (options?.search && options.search.trim()) {
    const s = `%${options.search.trim()}%`
    query = query.or(`title.ilike.${s},location_name.ilike.${s},short_description.ilike.${s}`)
  }

  if (options?.category && options.category !== "all") {
    query = query.eq("category", options.category)
  }

  if (options?.location && options.location !== "all") {
    query = query.ilike("location_name", `%${options.location}%`)
  }

  if (options?.minPrice !== undefined) {
    query = query.gte("price", options.minPrice)
  }

  if (options?.maxPrice !== undefined) {
    query = query.lte("price", options.maxPrice)
  }

  if (options?.limit) {
    const from = options.offset || 0
    const to = from + options.limit - 1
    query = query.range(from, to)
  }

  const { data, error } = await query

  if (error) throw error
  return (data ?? []).map((row) => mapTour(row as any))
}

/**
 * Fetch featured tours for the landing page with targeted columns and single join.
 */
export async function fetchFeaturedTours(limit = 6): Promise<Tour[]> {
  const { data, error } = await supabase
    .from("tours")
    .select(TOUR_CARD_SELECT)
    .eq("is_published", true)
    .order("rating", { ascending: false })
    .order("review_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map((row) => mapTour(row as any))
}

export async function fetchTourById(id: string): Promise<Tour | null> {
  const { data, error } = await supabase
    .from("tours")
    .select(TOUR_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapTour(data as any)
}

export async function fetchToursByHostId(hostId: string): Promise<Tour[]> {
  const { data, error } = await supabase
    .from("tours")
    .select(TOUR_CARD_SELECT)
    .eq("host_id", hostId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapTour(row as any))
}

export async function createTour(tourData: Partial<Tour>): Promise<Tour> {
  const insertPayload = {
    host_id: tourData.host_id,
    title: tourData.title,
    description: tourData.description,
    short_description: tourData.short_description || tourData.description?.substring(0, 150) || "",
    price: tourData.price,
    currency: tourData.currency || "KES",
    duration_hours: tourData.duration_hours,
    max_guests: tourData.max_guests || 10,
    location_name: tourData.location_name,
    latitude: tourData.latitude || -1.2921,
    longitude: tourData.longitude || 36.8219,
    category: tourData.category,
    tour_type: tourData.tour_type || "in_person",
    images: tourData.images || [],
    highlights: tourData.highlights || [],
    is_published: true,
    status: "published",
    availability: tourData.availability || {},
    tags: tourData.tags || [],
    physical_price: tourData.physical_price,
    virtual_price: tourData.virtual_price,
  }

  try {
    const { data, error } = await supabase
      .from("tours")
      .insert(insertPayload)
      .select(TOUR_DETAIL_SELECT)
      .single()

    if (!error && data) {
      return mapTour(data as any)
    }
    if (error) {
      console.warn("createTour detailed select returned error, falling back to simple select:", error.message)
    }
  } catch (err) {
    console.warn("createTour detailed select threw exception, trying fallback:", err)
  }

  // Resilient fallback select: insert or re-fetch with simple select
  const { data: fallbackData, error: fallbackErr } = await supabase
    .from("tours")
    .insert(insertPayload)
    .select("*")
    .single()

  if (fallbackErr) throw fallbackErr
  return mapTour(fallbackData as any)
}

export async function updateTour(id: string, tourData: Partial<Tour>): Promise<Tour> {
  const updatePayload: any = {
    title: tourData.title,
    description: tourData.description,
    short_description: tourData.short_description,
    price: tourData.price,
    currency: tourData.currency,
    duration_hours: tourData.duration_hours,
    max_guests: tourData.max_guests,
    location_name: tourData.location_name,
    latitude: tourData.latitude,
    longitude: tourData.longitude,
    category: tourData.category,
    tour_type: tourData.tour_type,
    images: tourData.images,
    highlights: tourData.highlights,
    availability: tourData.availability,
    tags: tourData.tags,
    physical_price: tourData.physical_price,
    virtual_price: tourData.virtual_price,
  }

  // Strip undefined
  Object.keys(updatePayload).forEach((key) => {
    if (updatePayload[key] === undefined) delete updatePayload[key]
  })

  const { data, error } = await supabase
    .from("tours")
    .update(updatePayload)
    .eq("id", id)
    .select(TOUR_DETAIL_SELECT)
    .single()

  if (error) throw error
  return mapTour(data as any)
}

export async function deleteTour(id: string): Promise<void> {
  const { error } = await supabase
    .from("tours")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export async function uploadTourImage(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error } = await supabase.storage
    .from("tour-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) throw error

  const {
    data: { publicUrl },
  } = supabase.storage.from("tour-images").getPublicUrl(filePath)

  return publicUrl
}

export async function incrementTourViews(tourId: string): Promise<void> {
  const { error } = await supabase.rpc("increment_tour_view", { tour_id: tourId })
  if (error) {
    console.warn("RPC failed, falling back to direct update", error)
    const { data } = await supabase.from("tours").select("views").eq("id", tourId).maybeSingle()
    const currentViews = Number(data?.views || 0)
    await supabase.from("tours").update({ views: currentViews + 1 } as any).eq("id", tourId)
  }
}
