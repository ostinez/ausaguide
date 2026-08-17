import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { DriftItem } from "@/components/ui/DriftWall"

const FALLBACK_ITEMS: DriftItem[] = [
  {
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=600&q=80",
    title: "Maasai Mara Sunrise Safari",
    href: "/tours",
  },
  {
    image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=600&q=80",
    title: "Nairobi Skyline & Street Food Walk",
    href: "/tours",
  },
  {
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
    title: "Diani Beach Sunset Dhow Cruise",
    href: "/tours",
  },
  {
    image: "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=600&q=80",
    title: "Mount Kenya Alpine Trail Trek",
    href: "/tours",
  },
  {
    image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=600&q=80",
    title: "Lamu Old Town Heritage Discovery",
    href: "/tours",
  },
  {
    image: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80",
    title: "Lake Nakuru Flamingo Wildlife Tour",
    href: "/tours",
  },
  {
    image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=600&q=80",
    title: "Hell's Gate Gorge Cycling Safari",
    href: "/tours",
  },
  {
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80",
    title: "Amboseli Elephant Sanctuary Experience",
    href: "/tours",
  },
  {
    image: "https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=600&q=80",
    title: "Samburu Cultural Village Immersion",
    href: "/tours",
  },
  {
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    title: "Tsavo West Red Elephant Expedition",
    href: "/tours",
  },
  {
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    title: "Karura Forest Canopy Walk & Coffee",
    href: "/feed",
  },
  {
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80",
    title: "Great Rift Valley Lookout Memories",
    href: "/feed",
  },
]

function shuffleArray<T>(arr: T[]): T[] {
  const array = [...arr]
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export function useWallItems() {
  const [items, setItems] = useState<DriftItem[]>(FALLBACK_ITEMS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Fetch up to 10 published tours
      let formattedTours: DriftItem[] = []
      try {
        const { data: toursData, error: toursError } = await supabase
          .from("tours")
          .select("id, title, cover_image, images")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(10)

        if (toursError) {
          console.warn("[useWallItems] Tours query notice:", toursError.message)
        } else if (toursData) {
          formattedTours = toursData
            .filter((t) => t.cover_image || (t.images && t.images.length > 0))
            .map((t) => ({
              image: t.cover_image || t.images?.[0] || FALLBACK_ITEMS[0].image,
              title: t.title || "Kenya Experience",
              href: `/tours/${t.id}`,
            }))
        }
      } catch (tErr) {
        console.warn("[useWallItems] Tours fetch failed:", tErr)
      }

      // 2. Fetch up to 5 community posts (posts schema: id, content, image_url)
      let formattedPosts: DriftItem[] = []
      try {
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("id, content, image_url")
          .not("image_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(5)

        if (postsError) {
          console.warn("[useWallItems] Posts query notice:", postsError.message)
        } else if (postsData) {
          formattedPosts = postsData
            .filter((p) => p.image_url)
            .map((p) => ({
              image: p.image_url,
              title: p.content?.slice(0, 45) || "Community Story",
              href: "/feed",
            }))
        }
      } catch (pErr) {
        console.warn("[useWallItems] Posts fetch failed:", pErr)
      }

      // 3. Fetch up to 5 journal entries (journals schema: id, title, image_url)
      let formattedJournals: DriftItem[] = []
      try {
        const { data: journalsData, error: journalsError } = await supabase
          .from("journals")
          .select("id, title, image_url")
          .not("image_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(5)

        if (!journalsError && journalsData) {
          formattedJournals = journalsData
            .filter((j) => j.image_url)
            .map((j) => ({
              image: j.image_url,
              title: j.title || "Travel Journal",
              href: "/journal",
            }))
        }
      } catch (jErr) {
        console.warn("[useWallItems] Journals fetch failed:", jErr)
      }

      const combined = [...formattedTours, ...formattedPosts, ...formattedJournals]

      if (combined.length >= 4) {
        setItems(shuffleArray(combined))
      } else {
        // Blend with vibrant fallbacks if database has few live rows
        setItems(shuffleArray([...combined, ...FALLBACK_ITEMS]))
      }
    } catch (err: any) {
      console.warn("[useWallItems] Using fallback items:", err)
      setError(err.message || "Failed to load live items")
      setItems(FALLBACK_ITEMS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return { items, loading, error, refresh: fetchItems }
}

export default useWallItems
