import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Heart, Trash2, ArrowRight, MapPin, Clock, Star, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { fetchWishlist, removeFromWishlist, type WishlistItem } from "@/lib/api/wishlist"
import { formatTourPrice, getTourGradient, getHostInitials } from "@/lib/tour-utils"
import { cn } from "@/lib/utils"

export default function WishlistPage() {
  const navigate = useNavigate()
  const userId = localStorage.getItem("user_id")
  const role = localStorage.getItem("user_role")

  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    fetchWishlist(userId)
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  async function handleRemove(tourId: string) {
    if (!userId) return
    setRemoving((s) => new Set([...s, tourId]))
    try {
      await removeFromWishlist(userId, tourId)
      setItems((prev) => prev.filter((i) => i.tour_id !== tourId))
    } finally {
      setRemoving((s) => { const n = new Set(s); n.delete(tourId); return n })
    }
  }

  if (!userId || role === "admin" || role === "host") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertCircle className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Access restricted</h2>
        <p className="text-muted-foreground">Log in as a traveler to view your wishlist.</p>
        <Link to="/auth"><Button className="rounded-full">Log In</Button></Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4">
        <div className="mb-10 flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-muted/40 rounded-xl transition-all" title="Back to Dashboard">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
            <Heart className="size-6 text-primary fill-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Your Wishlist</h1>
            <p className="text-sm text-muted-foreground">Tours you've saved for later</p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : error ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-center">
            <AlertCircle className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Heart className="size-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground">Your wishlist is empty</h3>
              <p className="text-sm text-muted-foreground mt-1">Browse tours and tap the heart to save them here.</p>
            </div>
            <Button onClick={() => navigate("/tours")} className="rounded-full">Browse Tours</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const tour = item.tour
              if (!tour) return null
              const hostName = tour.host?.full_name ?? "Local Host"
              const hostInitials = getHostInitials(hostName)
              return (
                <div
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Image / Gradient */}
                  <div
                    className="relative h-44"
                    style={{ background: getTourGradient(tour.category) }}
                  >
                    <div className="absolute -bottom-5 left-4">
                      <Avatar className="size-10 border-2 border-card">
                        <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                          {hostInitials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <button
                      onClick={() => handleRemove(item.tour_id)}
                      disabled={removing.has(item.tour_id)}
                      className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-background/70 text-destructive backdrop-blur-sm hover:bg-background transition-colors"
                    >
                      {removing.has(item.tour_id) ? (
                        <Spinner className="size-4" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-8">
                    <p className="text-xs font-medium text-muted-foreground">{hostName}</p>
                    <h3 className={cn(
                      "line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors"
                    )}>
                      {tour.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />{tour.location_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />{tour.duration_hours}h
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Star className="size-3.5 fill-primary text-primary" />
                      <span className="text-sm font-semibold text-foreground">{tour.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({tour.review_count})</span>
                    </div>

                    <div className="flex-1" />

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-bold text-foreground">
                        {formatTourPrice(tour.price, tour.currency)}
                        <span className="text-xs font-normal text-muted-foreground"> / person</span>
                      </span>
                      <Button
                        size="sm"
                        className="gap-1 rounded-full"
                        onClick={() => navigate(`/tours/${tour.id}`)}
                      >
                        Book Now <ArrowRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
