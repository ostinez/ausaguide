import { supabase } from "@/lib/supabase"
import type { Tour, Profile, TourCategory, TourType } from "@/lib/types"
import type { ProfileRow, TourRow } from "@/lib/database.types"

const TOUR_SELECT = `
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
    license_url,
    license_status,
    created_at,
    updated_at
  )
`

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
    host_tier: (row as any).host_tier ?? null,
    license_url: (row as any).license_url ?? null,
    license_status: (row as any).license_status ?? null,
    created_at: row.created_at ?? now,
    updated_at: row.updated_at ?? now,
  }
}

function normalizeTourType(type: string): TourType {
  return type === "virtual" ? "virtual" : "in_person"
}

function mapTour(
  row: TourRow & {
    host?: ProfileRow | null
  }
): Tour {
  const now = row.created_at ?? new Date().toISOString()
  const hostProfile = row.host

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

export async function fetchTours(): Promise<Tour[]> {
  const { data, error } = await supabase
    .from("tours")
    .select(TOUR_SELECT)
    .eq("is_published", true)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapTour(row as Parameters<typeof mapTour>[0]))
}

export async function fetchFeaturedTours(limit = 4): Promise<Tour[]> {
  const { data, error } = await supabase
    .from("tours")
    .select(TOUR_SELECT)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map((row) => mapTour(row as Parameters<typeof mapTour>[0]))
}

export async function fetchTourById(id: string): Promise<Tour | null> {
  const { data, error } = await supabase
    .from("tours")
    .select(TOUR_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapTour(data as Parameters<typeof mapTour>[0])
}

export async function fetchToursByHostId(hostId: string): Promise<Tour[]> {
  const { data, error } = await supabase
    .from("tours")
    .select(TOUR_SELECT)
    .eq("host_id", hostId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapTour(row as Parameters<typeof mapTour>[0]))
}

export async function createTour(tourData: Partial<Tour>): Promise<Tour> {
  const { data, error } = await supabase
    .from("tours")
    .insert({
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
      // Auto-publish: tours go live immediately; admins can moderate after
      is_published: true,
      status: "published",
      availability: tourData.availability || {},
      tags: tourData.tags || [],
    })
    .select(TOUR_SELECT)
    .single()

  if (error) throw error
  return mapTour(data as Parameters<typeof mapTour>[0])
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
  }

  if (tourData.status) {
    updatePayload.status = tourData.status
    updatePayload.is_published = tourData.status === "published"
  }
  if (tourData.availability) {
    updatePayload.availability = tourData.availability
  }
  if (tourData.tags) {
    updatePayload.tags = tourData.tags
  }

  const { data, error } = await supabase
    .from("tours")
    .update(updatePayload)
    .eq("id", id)
    .select(TOUR_SELECT)
    .single()

  if (error) throw error
  return mapTour(data as Parameters<typeof mapTour>[0])
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
    .from("tours")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    if (error.message.includes("Bucket not found")) {
      await supabase.storage.createBucket("tours", {
        public: true,
      })
      const { error: retryError } = await supabase.storage
        .from("tours")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })
      if (retryError) throw retryError
    } else {
      throw error
    }
  }

  const { data: { publicUrl } } = supabase.storage
    .from("tours")
    .getPublicUrl(filePath)

  return publicUrl
}

export async function incrementTourViews(tourId: string): Promise<void> {
  const { error } = await supabase.rpc("increment_tour_view", { tour_id: tourId })
  if (error) {
    console.warn("RPC failed, falling back to direct update", error)
    const { data } = await supabase.from("tours").select("views").eq("id", tourId).maybeSingle()
    const currentViews = Number(data?.views || 0)
    await supabase.from("tours").update({ views: currentViews + 1 }).eq("id", tourId)
  }
}
