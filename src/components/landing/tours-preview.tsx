import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { GradientText } from "@/components/ui/GradientText"
import { SkeletonTourGrid } from "@/components/ui/Skeleton"
import { ArrowRight, Loader2 } from "lucide-react"
import { fetchTours } from "@/lib/api/tours"
import type { Tour } from "@/lib/types"
import { TourCard } from "@/components/ui/TourCard"
import { fetchWishlist, addToWishlist, removeFromWishlist } from "@/lib/api/wishlist"
import { toast } from "sonner"

const PAGE_SIZE = 12

export function ToursPreview() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const userId = localStorage.getItem("user_id")

  // Fetch initial batch of 12 tours (limit 12)
  useEffect(() => {
    fetchTours({ limit: PAGE_SIZE, offset: 0 })
      .then((initialTours) => {
        setTours(initialTours)
        if (initialTours.length < PAGE_SIZE) {
          setHasMore(false)
        }
      })
      .catch((err) => {
        console.error("Failed to fetch initial tours:", err)
        setTours([])
        setHasMore(false)
      })
      .finally(() => setLoading(false))
  }, [])

  // Fetch wishlist
  useEffect(() => {
    if (userId) {
      fetchWishlist(userId)
        .then((items) => setWishlist(new Set(items.map((item) => item.tour_id))))
        .catch(console.error)
    }
  }, [userId])

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextBatch = await fetchTours({ limit: PAGE_SIZE, offset: tours.length })
      if (nextBatch.length === 0) {
        setHasMore(false)
      } else {
        setTours((prev) => [...prev, ...nextBatch])
        if (nextBatch.length < PAGE_SIZE) {
          setHasMore(false)
        }
      }
    } catch (err) {
      console.error("Failed to load more tours:", err)
      toast.error("Could not load more tours.")
    } finally {
      setLoadingMore(false)
    }
  }

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
            <h2 className="text-3xl font-bold tracking-tight text-white">
              <GradientText
                colors={["#B7E6E5", "#317978", "#B7E6E5"]}
                animationSpeed={4}
                yoyo={true}
              >
                Popular Tours
              </GradientText>
            </h2>
            <p className="mt-2 text-[#599D9C]">Experiences handpicked by our community</p>
          </div>
          <Link to="/tours" className="hidden sm:block">
            <Button variant="ghost" className="text-[#B7E6E5] hover:text-white hover:bg-[#184948]">
              View All
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="animate-in fade-in duration-300">
            <SkeletonTourGrid count={12} mobileCount={4} />
          </div>
        ) : tours.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
              {tours.map((tour) => (
                <div key={tour.id}>
                  <TourCard
                    tour={tour}
                    isWishlisted={wishlist.has(tour.id)}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </div>
              ))}
            </div>

            {/* Load More Button for homepage exploration */}
            {hasMore && (
              <div className="mt-12 flex justify-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  size="lg"
                  className="rounded-full px-8 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Loading more tours...
                    </>
                  ) : (
                    "Load More Tours"
                  )}
                </Button>
              </div>
            )}
          </>
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
export default ToursPreview
