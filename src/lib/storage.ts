import { supabase } from "@/lib/supabase"

/** Canonical public storage buckets. Must match supabase/migrations/20261025000000_storage_avatars_tour_images.sql */
export const STORAGE_BUCKETS = {
  avatars: "avatars",
  tourImages: "tour-images",
} as const

/** Legacy bucket names still referenced in older code paths → mapped to canonical buckets. */
const LEGACY_BUCKET_MAP: Record<string, string> = {
  tours: STORAGE_BUCKETS.tourImages,
  tour_images: STORAGE_BUCKETS.tourImages,
}

export function resolveBucket(bucket: string): string {
  return LEGACY_BUCKET_MAP[bucket] ?? bucket
}

export class StorageUploadError extends Error {
  readonly original?: unknown
  constructor(message: string, cause?: unknown) {
    super(message)
    this.original = cause
    this.name = "StorageUploadError"
  }
}

function friendlyMessage(raw: string): string {
  const m = raw.toLowerCase()
  if (m.includes("bucket not found")) {
    return "Image storage isn't configured yet. Please try again later or contact support."
  }
  if (m.includes("row-level security") || m.includes("unauthorized") || m.includes("403")) {
    return "You don't have permission to upload here. Please sign in again and retry."
  }
  if (m.includes("payload too large") || m.includes("413")) {
    return "That file is too large. Please choose a smaller image."
  }
  return raw || "Upload failed. Please try again."
}

/**
 * Uploads an image into `<bucket>/<userId>/<random>.<ext>` so RLS can scope
 * writes to the owner's folder. Returns the public URL.
 * Never attempts to create buckets client-side (anon keys can't) — buckets are provisioned via SQL.
 */
export async function uploadImage(bucket: string, file: File, prefix = "img"): Promise<string> {
  const target = resolveBucket(bucket)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new StorageUploadError("Please sign in to upload images.")

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const path = `${user.id}/${prefix}_${Math.random().toString(36).slice(2, 12)}_${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(target)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type })

  if (error) throw new StorageUploadError(friendlyMessage(error.message), error)

  const { data: { publicUrl } } = supabase.storage.from(target).getPublicUrl(path)
  return publicUrl
}
