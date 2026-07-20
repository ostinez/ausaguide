import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { GradientText } from "@/components/ui/GradientText"
import { Spinner } from "@/components/ui/spinner"
import { Sparkles, ArrowRight, Compass } from "lucide-react"
import { fetchFeaturedTours } from "@/lib/api/tours"
import { formatTourPrice } from "@/lib/tour-utils"
import Stack from "@/components/ui/Stack"
import type { StackCardData } from "@/components/ui/Stack"
import { GlareHover } from "@/components/ui/GlareHover"
import { addToWishlist } from "@/lib/api/wishlist"
import { toast } from "sonner"

export function DiscoverToursStack() {
  const [cards, setCards] = useState<StackCardData[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const userId = localStorage.getItem("user_id")
  const role = localStorage.getItem("user_role")

  const handleSwipeRight = async (card: StackCardData) => {
    if (!userId) {
      toast.error("Please log in to save tours to your wishlist!")
      return
    }
    if (role === "host" || role === "admin") {
      toast.error("Only travelers can wishlist experiences.")
      return
    }
    try {
      await addToWishlist(userId, String(card.id))
      toast.success(`Saved "${card.title}" to wishlist! ❤️`)
    } catch (err) {
      console.error(err)
      toast.error("Could not save to wishlist.")
    }
  }

  const handleSwipeLeft = (card: StackCardData) => {
    toast.info(`Skipped "${card.title}" ✖️`)
  }

  useEffect(() => {
    // Fetch 6 featured tours to populate the Tinder-style stack
    fetchFeaturedTours(6)
      .then((tours) => {
        const formatted = tours.map((tour) => ({
          id: tour.id,
          title: tour.title,
          image: tour.images?.[0] || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
          location: tour.location_name,
          price: formatTourPrice(tour.price, tour.currency),
          onClick: () => navigate(`/tours/${tour.id}`),
        }))
        setCards(formatted)
      })
      .catch(() => setCards([]))
      .finally(() => setLoading(false))
  }, [navigate])

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Ambient background accent glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-[350px] w-[500px] rounded-full bg-[#7F5AF0]/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 h-[350px] w-[500px] rounded-full bg-[#2CB67D]/3 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading & Copy */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#7F5AF0]/35 bg-[#7F5AF0]/10 text-xs font-bold uppercase tracking-wider text-[#a78bfa] animate-pulse">
              <Sparkles className="size-3.5" />
              Quick Discovery
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Swipe Through <br />
              <GradientText
                colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]}
                animationSpeed={5}
                yoyo={true}
              >
                Local Adventures
              </GradientText>
            </h2>
            
            <p className="text-base sm:text-lg text-white/60 max-w-xl leading-relaxed">
              Don't know where to start? Tap or drag the cards in the stack to browse Nairobi street food tours, Maasai cultural homestays, and wild game safaris instantly. Swipe left or right to cycling cards, or click to inspect details!
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/tours">
                <GlareHover style={{ borderRadius: "9999px", display: "inline-block" }}>
                  <Button className="rounded-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] border-none text-white hover:opacity-95 shadow shadow-[#7F5AF0]/20 font-bold px-6 py-5 flex items-center gap-2">
                    <Compass className="size-4" />
                    Explore Full Catalog
                    <ArrowRight className="size-4" />
                  </Button>
                </GlareHover>
              </Link>
            </div>
          </div>

          {/* Right Column: Tinder Stack component */}
          <div className="lg:col-span-5 flex justify-center items-center min-h-[460px]">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Spinner className="size-8 text-primary" />
                <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Loading cards...</p>
              </div>
            ) : cards.length > 0 ? (
              <Stack
                cards={cards}
                randomRotation={true}
                sensitivity={150}
                sendToBackOnClick={true}
                autoplay={true}
                autoplayDelay={3500}
                pauseOnHover={true}
                animationConfig={{ stiffness: 220, damping: 22 }}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
              />
            ) : (
              <div className="flex h-[440px] w-[320px] items-center justify-center rounded-2xl border border-border bg-[#16161A]/40 text-sm text-white/40">
                No tours available for stacking
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
export default DiscoverToursStack
