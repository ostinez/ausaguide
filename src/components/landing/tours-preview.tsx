import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { GradientText } from "@/components/ui/GradientText"
import { SkeletonTourGrid } from "@/components/ui/SkeletonCard"
import { ArrowRight } from "lucide-react"
import { fetchFeaturedTours } from "@/lib/api/tours"
import type { Tour } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { TourCard } from "@/components/ui/TourCard"
import { fetchWishlist, addToWishlist, removeFromWishlist } from "@/lib/api/wishlist"
import { toast } from "sonner"

export function ToursPreview() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const userId = localStorage.getItem("user_id")

  // Fetch featured tours + subscribe to realtime view count updates
  useEffect(() => {
    fetchFeaturedTours(3)
      .then(setTours)
      .catch(() => setTours([]))
      .finally(() => setLoading(false))

    // Realtime views updates
    const channel = supabase
      .channel("featured-tours-views-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tours" },
        (payload) => {
          const updated = payload.new as any
          setTours((prev) =>
            prev.map((t) =>
              t.id === updated.id
                ? { ...t, views: Number(updated.views || 0) }
                : t
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Fetch wishlist
  useEffect(() => {
    if (userId) {
      fetchWishlist(userId)
        .then((items) => setWishlist(new Set(items.map((item) => item.tour_id))))
        .catch(console.error)
    }
  }, [userId])

  const handleToggleWishlist = async (tourId: string, isCurrentlyWishlisted: boolean) => {
    if (!userId) {
      toast.error("Please log in to save tours.")
      return
    }

    try {
      if (isCurrentlyWishlisted) {
        await removeFromWishlist(userId, tourId)
        setWishlist((prev) => {
          const next = new Set(prev)
          next.delete(tourId)
          return next
        })
        toast.success("Tour removed from wishlist")
      } else {
        await addToWishlist(userId, tourId)
        setWishlist((prev) => {
          const next = new Set(prev)
          next.add(tourId)
          return next
        })
        toast.success("Tour saved to wishlist")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to update wishlist")
    }
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              <GradientText
                colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]}
                animationSpeed={4}
                yoyo={true}
              >
                Popular Tours
              </GradientText>
            </h2>
            <p className="mt-2 text-muted-foreground">Experiences handpicked by our community</p>
          </div>
          <Link to="/tours" className="hidden sm:block">
            <Button variant="ghost" className="text-primary">
              View All
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <SkeletonTourGrid count={3} />
        ) : tours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                isWishlisted={wishlist.has(tour.id)}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No tours found
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link to="/tours">
            <Button variant="ghost" className="text-primary">
              View All Tours
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
