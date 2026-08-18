import { supabase } from "@/lib/supabase"

export interface Interest {
  id: string
  name: string
  icon: string
  category: string
}

export const DEFAULT_INTERESTS: { id: string; name: string; icon: string; category: string }[] = [
  { id: "nature-wildlife", name: "🌿 Nature & Wildlife", icon: "🌿", category: "adventure" },
  { id: "history-culture", name: "🏛️ History & Culture", icon: "🏛️", category: "culture" },
  { id: "food-dining", name: "🍽️ Food & Dining", icon: "🍽️", category: "lifestyle" },
  { id: "arts-crafts", name: "🎨 Arts & Crafts", icon: "🎨", category: "culture" },
  { id: "adventure-sports", name: "🏄 Adventure Sports", icon: "🏄", category: "adventure" },
  { id: "photography", name: "📸 Photography", icon: "📸", category: "hobby" },
  { id: "wellness", name: "🧘 Wellness & Relaxation", icon: "🧘", category: "lifestyle" },
  { id: "music-nightlife", name: "🎵 Music & Nightlife", icon: "🎵", category: "entertainment" },
  { id: "shopping", name: "🛍️ Shopping & Markets", icon: "🛍️", category: "lifestyle" },
  { id: "walking-tours", name: "🚶 Walking Tours", icon: "🚶", category: "adventure" },
  { id: "beaches", name: "🏖️ Beaches & Water", icon: "🏖️", category: "adventure" },
  { id: "mountains", name: "🏔️ Mountains & Hiking", icon: "🏔️", category: "adventure" },
  { id: "safari", name: "🐘 Safari & Wildlife", icon: "🐘", category: "adventure" },
  { id: "camping", name: "🏕️ Camping & Glamping", icon: "🏕️", category: "adventure" },
  { id: "coffee-tea", name: "☕ Coffee & Tea Tours", icon: "☕", category: "food" },
]

/**
 * Fetch all available interests from database (with fallback to defaults)
 */
export async function fetchAllInterests(): Promise<Interest[]> {
  try {
    const { data, error } = await supabase
      .from("interests")
      .select("*")
      .order("name", { ascending: true })

    if (error || !data || data.length === 0) {
      return DEFAULT_INTERESTS
    }

    return data as Interest[]
  } catch {
    return DEFAULT_INTERESTS
  }
}

/**
 * Fetch a user's selected interest names or IDs
 */
export async function fetchUserInterests(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("user_interests")
      .select("interest_id, interests(id, name)")
      .eq("user_id", userId)

    if (error || !data) {
      // Check localStorage fallback
      const cached = localStorage.getItem(`user_interests_${userId}`)
      return cached ? JSON.parse(cached) : []
    }

    const ids: string[] = []
    data.forEach((row: any) => {
      if (row.interest_id) ids.push(row.interest_id)
      if (row.interests?.name) ids.push(row.interests.name)
    })

    return ids
  } catch {
    const cached = localStorage.getItem(`user_interests_${userId}`)
    return cached ? JSON.parse(cached) : []
  }
}

/**
 * Save user interests
 */
export async function saveUserInterests(userId: string, interestNamesOrIds: string[]): Promise<boolean> {
  try {
    // Cache locally
    localStorage.setItem(`user_interests_${userId}`, JSON.stringify(interestNamesOrIds))

    // 1. Get interests table rows to map IDs
    const { data: dbInterests } = await supabase
      .from("interests")
      .select("id, name")

    const resolvedIds: string[] = []
    if (dbInterests && dbInterests.length > 0) {
      interestNamesOrIds.forEach((item) => {
        const found = dbInterests.find((dbi) => dbi.id === item || dbi.name === item || dbi.name.includes(item))
        if (found) resolvedIds.push(found.id)
      })
    }

    // Fallback: If DB interests table exists, delete old and insert new
    if (resolvedIds.length > 0) {
      await supabase
        .from("user_interests")
        .delete()
        .eq("user_id", userId)

      const toInsert = resolvedIds.map((iid) => ({
        user_id: userId,
        interest_id: iid,
      }))

      await supabase.from("user_interests").insert(toInsert)
    }

    return true
  } catch (err) {
    console.warn("Non-fatal user interests save:", err)
    return true
  }
}
