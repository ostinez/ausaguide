import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { MapPin, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { supabase } from "@/lib/supabase"
import { fetchHostSettings } from "@/lib/api/availability"
import type { Profile, Tour } from "@/lib/types"
import { HostCardCarousel } from "@/components/ui/HostCardCarousel"
import { TourCard } from "@/components/ui/TourCard"
import { fetchWishlist, addToWishlist, removeFromWishlist } from "@/lib/api/wishlist"
import { toast } from "sonner"

export default function HostProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Mock Host Settings
  const [isBusy, setIsBusy] = useState(false)
  const [busyReason, setBusyReason] = useState<string | null>(null)

  const userId = localStorage.getItem("user_id")
  const role = localStorage.getItem("user_role")
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (userId && role === "traveler") {
      fetchWishlist(userId)
        .then((items) => {
          setWishlist(new Set(items.map((item) => item.tour_id)))
        })
        .catch(console.error)
    }
  }, [userId, role])

  const handleToggleWishlist = async (tourId: string, isWishlisted: boolean) => {
    if (!userId) {
      toast.error("Please log in as a traveler to save tours to your wishlist.")
      return
    }
    if (role !== "traveler") {
      toast.error("Only travelers can wishlist tours.")
      return
    }

    try {
      if (isWishlisted) {
        await removeFromWishlist(userId, tourId)
        setWishlist((prev) => {
          const next = new Set(prev)
          next.delete(tourId)
          return next
        })
        toast.success("Removed from wishlist")
      } else {
        await addToWishlist(userId, tourId)
        setWishlist((prev) => {
          const next = new Set(prev)
          next.add(tourId)
          return next
        })
        toast.success("Added to wishlist")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to update wishlist.")
    }
  }

  useEffect(() => {
    async function loadHost() {
      if (!id) return
      setLoading(true)
      try {
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("id, role, full_name, avatar_url, bio, location, languages, host_type, is_verified")
          .eq("id", id)
          .maybeSingle()

        if (profileErr) throw profileErr
        if (!profileData || profileData.role !== "host") {
          throw new Error("Host not found")
        }

        const { data: toursData, error: toursErr } = await supabase
          .from("tours")
          .select("id, host_id, title, description, price, currency, duration_hours, max_guests, location_name, category, tour_type, rating, review_count, is_published, views")
          .eq("host_id", id)
          .eq("is_published", true)

        if (toursErr) throw toursErr

        setProfile(profileData as unknown as Profile)
        setTours((toursData ?? []) as unknown as Tour[])
        
        const settings = await fetchHostSettings(id)
        if (settings) {
          setIsBusy(settings.is_busy)
          setBusyReason(settings.busy_reason || "Currently busy")
        } else {
          setIsBusy(false)
        }

      } catch (err: any) {
        setError(err.message || "Failed to load host profile")
      } finally {
        setLoading(false)
      }
    }
    loadHost()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 text-center">
        <div className="max-w-md space-y-4">
          <AlertCircle className="mx-auto size-12 text-muted-foreground" />
          <h2 className="text-xl font-bold">Host Not Found</h2>
          <p className="text-muted-foreground">{error}</p>
          <Link to="/tours">
            <Button className="mt-4 rounded-full">Browse all tours</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-24">
      {/* Glow effect */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 space-y-8">
        
        {/* Profile Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            <Avatar className="size-24 border-2 border-border/50 shadow-xl md:size-32">
              <AvatarFallback className="bg-primary/10 text-3xl font-bold text-primary md:text-4xl">
                {profile.full_name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{profile.full_name}</h1>
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <Badge variant="secondary" className="capitalize">
                  {profile.host_type?.replace("_", " ")}
                </Badge>
                {profile.is_verified && (
                  <Badge variant="outline" className="border-teal/30 bg-teal/10 text-teal">
                    Verified Host
                  </Badge>
                )}
                {profile.location && (
                  <span className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-1 size-3.5" />
                    {profile.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Availability Status Badge */}
          <div className="flex justify-center md:justify-end">
            <div className={`flex flex-col items-center justify-center rounded-2xl border px-6 py-4 shadow-sm ${
              isBusy 
                ? "border-destructive/20 bg-destructive/5 text-destructive" 
                : "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`size-2.5 rounded-full ${isBusy ? "bg-destructive animate-pulse" : "bg-emerald-500"}`} />
                <span className="font-semibold text-sm">
                  {isBusy ? "Busy" : "Available to book"}
                </span>
              </div>
              {isBusy && busyReason && (
                <span className="text-xs opacity-80">{busyReason}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          
          {/* Left Column - Bio & Info */}
          <div className="space-y-6 md:col-span-1">
            <HostCardCarousel 
              hostId={profile.id} 
              aspectRatio="video"
              className="border-2 border-primary/20 shadow-lg animate-in fade-in duration-500"
            />
            <Card className="border-border/60 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base">About {profile.full_name.split(" ")[0]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.bio || "This host hasn't written a bio yet."}
                </p>
                {profile.languages.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages.map(lang => (
                        <Badge key={lang} variant="outline" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tours */}
          <div className="space-y-6 md:col-span-2">
            <h2 className="text-xl font-bold tracking-tight">Experiences by {profile.full_name.split(" ")[0]}</h2>
            {tours.length === 0 ? (
              <Card className="border-border/60 bg-card/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  This host doesn't have any published tours yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {tours.map(tour => (
                  <TourCard
                    key={tour.id}
                    tour={tour}
                    isWishlisted={wishlist.has(tour.id)}
                    onToggleWishlist={handleToggleWishlist}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
