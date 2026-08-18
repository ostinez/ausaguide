import { supabase } from "./supabase"
import type { Tour } from "./types"
import { fetchUserInterests } from "./api/interests"

// Keyword mappings for interests
const INTEREST_KEYWORDS: Record<string, string[]> = {
  "nature-wildlife": ["nature", "wildlife", "animals", "forest", "park", "flora", "green", "safari"],
  "safari": ["safari", "game drive", "big five", "lion", "elephant", "maasai mara", "amboseli"],
  "history-culture": ["history", "culture", "museum", "tradition", "heritage", "monument", "tribe"],
  "food-dining": ["food", "dining", "street food", "culinary", "taste", "restaurant", "market", "cooking"],
  "arts-crafts": ["art", "craft", "beadwork", "curio", "sculpture", "painting", "artisan"],
  "adventure-sports": ["adventure", "rafting", "climbing", "zipline", "quad", "biking", "extreme"],
  "photography": ["photo", "photography", "scenic", "viewpoint", "sunset", "panoramic"],
  "wellness": ["wellness", "spa", "retreat", "relaxation", "yoga", "meditation", "hot springs"],
  "music-nightlife": ["music", "nightlife", "club", "live band", "lounge", "rooftop"],
  "shopping": ["shopping", "market", "souvenir", "curios", "mall", "textiles"],
  "walking-tours": ["walk", "walking", "city walk", "pedestrian", "stroll", "guide"],
  "beaches": ["beach", "coastal", "ocean", "snorkeling", "dhow", "marine", "diani", "mombasa"],
  "mountains": ["mountain", "hiking", "trek", "mt kenya", "rift valley", "crater", "peak"],
  "camping": ["camp", "camping", "glamping", "bonfire", "outdoors", "wilderness"],
  "coffee-tea": ["coffee", "tea", "plantation", "farm", "roastery", "brew"],
}

/**
 * Get personalized tour recommendations for a user based on their selected interests
 */
export async function getRecommendedTours(userId?: string): Promise<Tour[]> {
  try {
    let uid = userId
    if (!uid) {
      const { data: authData } = (await supabase.auth?.getUser?.()) ?? { data: { user: null } }
      uid = authData?.user?.id
    }

    // 1. Fetch user interests
    const userInterests = uid ? await fetchUserInterests(uid) : []

    // 2. Fetch published tours with host profile
    const { data: tours, error } = await supabase
      .from("tours")
      .select("*, host:profiles(*)")
      .eq("is_published", true)

    if (error || !tours || tours.length === 0) {
      return getPopularTours()
    }

    if (userInterests.length === 0) {
      // If user has no interests, return sorted by rating & views
      return (tours as Tour[])
        .sort((a, b) => (b.rating || 0) * 10 + (b.review_count || 0) - ((a.rating || 0) * 10 + (a.review_count || 0)))
        .slice(0, 12)
    }

    // 3. Score and rank tours based on user interests
    const scoredTours = (tours as Tour[]).map((tour) => {
      let score = (tour.rating || 4.5) * 2

      if (tour.host?.host_tier === "certified_guide") {
        score += 3
      }

      userInterests.forEach((rawInterest) => {
        const key = rawInterest.toLowerCase().replace(/[^a-z0-9-]/g, "")
        const keywords = INTEREST_KEYWORDS[key] || [key]

        // Category match
        if (tour.category && keywords.includes(tour.category.toLowerCase())) {
          score += 15
        }

        // Tags match
        if (tour.tags && Array.isArray(tour.tags)) {
          tour.tags.forEach((tag) => {
            if (keywords.some((kw) => tag.toLowerCase().includes(kw))) {
              score += 10
            }
          })
        }

        // Title and description match
        const textToSearch = `${tour.title} ${tour.short_description || ""} ${tour.description || ""}`.toLowerCase()
        keywords.forEach((kw) => {
          if (kw.length > 3 && textToSearch.includes(kw)) {
            score += 4
          }
        })
      })

      return { tour, score }
    })

    // Sort descending by calculated score
    scoredTours.sort((a, b) => b.score - a.score)

    return scoredTours.map((item) => item.tour).slice(0, 12)
  } catch (err) {
    console.error("getRecommendedTours error:", err)
    return getPopularTours()
  }
}

/**
 * Get popular tours sorted by ratings and bookings
 */
export async function getPopularTours(): Promise<Tour[]> {
  try {
    const { data: tours } = await supabase
      .from("tours")
      .select("*, host:profiles(*)")
      .eq("is_published", true)
      .order("rating", { ascending: false })
      .limit(12)

    return (tours as Tour[]) || []
  } catch {
    return []
  }
}
