import { supabase } from "@/lib/supabase"
import type { Tour } from "@/lib/types"

export interface WishlistItem {
  id: string
  user_id: string
  tour_id: string
  created_at: string
  tour?: Tour
}

export async function fetchWishlist(userId: string): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from("wishlist")
    .select(`*, tour:tours(*, host:profiles(*))`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as WishlistItem[]
}

export async function addToWishlist(userId: string, tourId: string): Promise<void> {
  const { error } = await supabase
    .from("wishlist")
    .insert({ user_id: userId, tour_id: tourId })

  if (error && error.code !== "23505") throw error // ignore duplicate
}

export async function removeFromWishlist(userId: string, tourId: string): Promise<void> {
  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("user_id", userId)
    .eq("tour_id", tourId)

  if (error) throw error
}

export async function isInWishlist(userId: string, tourId: string): Promise<boolean> {
  const { data } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", userId)
    .eq("tour_id", tourId)
    .maybeSingle()

  return !!data
}
