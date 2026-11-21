import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { MapPin, AlertCircle, ArrowLeft, BadgeCheck, Star, Bookmark, MessageSquare, Camera, GraduationCap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SkeletonProfile } from "@/components/ui/Skeleton"
import ReviewList from "@/components/ui/ReviewList"
import { supabase } from "@/lib/supabase"
import { fetchHostSettings } from "@/lib/api/availability"
import type { Profile, Tour } from "@/lib/types"
import { HostCardCarousel } from "@/components/ui/HostCardCarousel"
import { TourCard } from "@/components/ui/TourCard"
import { fetchToursByHostId } from "@/lib/api/tours"
import { fetchWishlist, addToWishlist, removeFromWishlist } from "@/lib/api/wishlist"
import { toast } from "sonner"
import { formatSocialLink, cn } from "@/lib/utils"
import { trackView } from "@/lib/api/content"
import { FollowButton } from "@/components/common/FollowButton"

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

export default function HostProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  
  // Host Settings
  const [isBusy, setIsBusy] = useState(false)
  const [busyReason, setBusyReason] = useState<string | null>(null)

  const userId = localStorage.getItem("user_id")
  const role = localStorage.getItem("user_role")
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

  useEffect(() => {
    if (userId && role === "traveler") {
      fetchWishlist(userId)
        .then((items) => {
          setWishlist(new Set(items.map((item) => item.tour_id)))
        })
        .catch(console.error)
    }

    // Check if host is bookmarked locally
    if (id) {
      const saved = localStorage.getItem(`bookmark_host_${id}`)
      if (saved === "true") setIsBookmarked(true)
    }
  }, [userId, role, id])

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

  const handleBookmarkHost = () => {
    if (!profile) return
    const next = !isBookmarked
    setIsBookmarked(next)
    if (next) {
      localStorage.setItem(`bookmark_host_${profile.id}`, "true")
      toast.success(`Saved ${profile.full_name} to your bookmarks!`)
    } else {
      localStorage.removeItem(`bookmark_host_${profile.id}`)
      toast.success("Removed from bookmarks")
    }
  }

  useEffect(() => {
    async function loadHost() {
      if (!id) return
      setLoading(true)
      try {
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("id, role, full_name, avatar_url, bio, location, languages, host_type, is_verified, host_tier, verified_guide, rejected_as_guide, tiktok, instagram, facebook, reddit, rating, tours_completed, hourly_rate, verification_status, qualifications_experience, qualifications_highlights, qualifications_education")
          .eq("id", id)
          .maybeSingle()

        if (profileErr) throw profileErr
        if (!profileData || profileData.role !== "host") {
          throw new Error("Host not found")
        }

        const toursData = await fetchToursByHostId(id)
        const publishedTours = toursData.filter((t) => t.is_published || t.status === "published")

        setProfile(profileData as unknown as Profile)
        setTours(publishedTours)
        
        const settings = await fetchHostSettings(id)
        if (settings) {
          setIsBusy(settings.is_busy)
          setBusyReason(settings.busy_reason || "Currently busy")
        } else {
          setIsBusy(false)
        }

        // Track host view
        trackView("host", id, userId)

      } catch (err: any) {
        setError(err.message || "Failed to load host profile")
      } finally {
        setLoading(false)
      }
    }
    loadHost()
  }, [id, userId])

  if (loading) {
    return <SkeletonProfile />
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

  const isVerified = Boolean(
    profile.is_verified ||
    (profile as any).verified_guide ||
    (profile as any).verification_status === "verified" ||
    (profile as any).verification_status === "approved"
  )

  const ratingValue = (profile as any).rating ? Number((profile as any).rating).toFixed(1) : "4.8"
  const toursCompleted = (profile as any).tours_completed ?? (tours.length > 0 ? `${tours.length * 8}+` : "45+")
  const hourlyRate = (profile as any).hourly_rate ? `$${(profile as any).hourly_rate}/hr` : "$50/hr"

  return (
    <div className="min-h-screen bg-background pb-20 pt-20 sm:pt-24 animate-in fade-in duration-300">
      {/* Background glow effect */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 space-y-8">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/tours")}
            aria-label="Go back"
            className="inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-card/60 hover:bg-card border border-border/60 shadow-sm transition-all duration-200 active:scale-95"
          >
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </button>

          {id && (
            <FollowButton
              targetUserId={id}
              targetUserName={profile.full_name}
              targetIsPrivate={(profile as any).is_private}
              size="default"
            />
          )}
        </div>

        {/* ── Option B: Modern Mobile Profile Card ── */}
        <div className="mx-auto max-w-md w-full bg-card rounded-3xl border border-border/70 p-6 sm:p-8 shadow-modern space-y-6 text-center">
          {/* Top: Large circular Profile Picture */}
          <div className="relative mx-auto size-28 sm:size-32">
            <Avatar className="size-full border-4 border-card shadow-xl ring-2 ring-primary/20">
              <AvatarImage src={profile.avatar_url ?? ""} alt={profile.full_name} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-3xl font-black text-primary">
                {profile.full_name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute bottom-1 right-1 size-5 rounded-full border-2 border-card ring-2 ring-background",
                isBusy ? "bg-amber-500" : "bg-emerald-500"
              )}
              title={isBusy ? (busyReason || "Currently busy") : "Available to guide"}
            />
          </div>

          {/* Middle: Name with Blue Verified Checkmark & Bio */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <h1 className="text-2xl font-black text-foreground tracking-tight">{profile.full_name}</h1>
              {isVerified && (
                <span title="Verified Host">
                  <BadgeCheck className="size-6 text-blue-500 fill-blue-500/20 shrink-0" />
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="secondary" className="capitalize text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {profile.host_type?.replace("_", " ") || "Local Host"}
              </Badge>
              {profile.location && (
                <span className="flex items-center text-xs text-muted-foreground gap-1">
                  <MapPin className="size-3 text-primary" />
                  {profile.location}
                </span>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed pt-1 line-clamp-3">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Stats Row: Star rating, Tours Completed, Hourly Rate */}
          <div className="grid grid-cols-3 divide-x divide-border/60 bg-muted/30 rounded-2xl p-3 border border-border/50">
            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                <Star className="size-4 text-amber-500 fill-amber-500" />
                <span>{ratingValue}</span>
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5">Rating</span>
            </div>

            <div className="flex flex-col items-center justify-center px-1">
              <div className="text-sm font-bold text-foreground">
                {toursCompleted}
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5">Tours</span>
            </div>

            <div className="flex flex-col items-center justify-center px-1">
              <div className="text-sm font-bold text-foreground">
                {hourlyRate}
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5">Rate</span>
            </div>
          </div>

          {/* Bottom: Black "Get in Touch" button next to square "Save/Bookmark" icon */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => navigate(`/messages?userId=${profile.id}`)}
              className="flex-1 h-12 rounded-2xl bg-zinc-950 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="size-4" />
              <span>Message Host</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleBookmarkHost}
              className={cn(
                "size-12 rounded-2xl border border-border/80 bg-card hover:bg-accent/60 shrink-0 transition-all cursor-pointer",
                isBookmarked && "border-amber-500/50 bg-amber-500/10 text-amber-500"
              )}
              title={isBookmarked ? "Saved to bookmarks" : "Save / Bookmark Host"}
            >
              <Bookmark className={cn("size-5", isBookmarked && "fill-amber-500 text-amber-500")} />
            </Button>
          </div>

          {/* Payment Protection Banner */}
          <p className="text-[11px] text-muted-foreground/75 text-center leading-relaxed px-1">
            🛡️ To help protect your payment, always use Ausaguide to send money and communicate with hosts.
          </p>
        </div>

        {/* ── Host Details & Experiences ── */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 pt-4">
          {/* Left Column: Media Gallery, Languages, Bio */}
          <div className="space-y-6 md:col-span-1">
            <HostCardCarousel 
              hostId={profile.id} 
              aspectRatio="video"
              className="border border-border/60 rounded-3xl shadow-md overflow-hidden"
            />

            <Card className="border-border/60 bg-card shadow-modern rounded-3xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">About {profile.full_name.split(" ")[0]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.bio || "Local host registered on Ausaguide."}
                </p>

                {profile.languages && profile.languages.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.languages.map(lang => (
                        <Badge key={lang} variant="outline" className="text-xs rounded-full px-2.5 py-0.5">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Channels */}
                {(profile.instagram || profile.facebook || profile.tiktok || profile.reddit) && (
                  <div className="pt-2 border-t border-border/40">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Social Channels</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      {profile.instagram && (
                        <a
                          href={formatSocialLink("instagram", profile.instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Instagram"
                        >
                          <InstagramIcon className="size-4" />
                        </a>
                      )}
                      {profile.facebook && (
                        <a
                          href={formatSocialLink("facebook", profile.facebook)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Facebook"
                        >
                          <FacebookIcon className="size-4" />
                        </a>
                      )}
                      {profile.tiktok && (
                        <a
                          href={formatSocialLink("tiktok", profile.tiktok)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-muted/40 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                          title="TikTok"
                        >
                          TikTok
                        </a>
                      )}
                      {profile.reddit && (
                        <a
                          href={formatSocialLink("reddit", profile.reddit)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-muted/40 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                          title="Reddit"
                        >
                          Reddit
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Tours */}
          <div className="space-y-6 md:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Experiences by {profile.full_name.split(" ")[0]}
              </h2>
              <Badge variant="outline" className="rounded-full text-xs font-medium">
                {tours.length} {tours.length === 1 ? "tour" : "tours"}
              </Badge>
            </div>

            {tours.length === 0 ? (
              <Card className="border-border/60 bg-card shadow-modern rounded-3xl">
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

            {/* My Qualifications Section (Airbnb-style) */}
            {(profile.qualifications_experience || profile.qualifications_highlights || profile.qualifications_education) && (
              <Card className="border-border/60 bg-card shadow-modern rounded-3xl overflow-hidden mt-8">
                <CardHeader className="pb-3 border-b border-border/30">
                  <CardTitle className="text-base font-bold">My Qualifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {profile.qualifications_experience && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                        <Camera className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-foreground">Experience</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                          {profile.qualifications_experience}
                        </p>
                      </div>
                    </div>
                  )}

                  {profile.qualifications_highlights && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                        <Star className="size-4 fill-amber-500/20" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-foreground">Career Highlights</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                          {profile.qualifications_highlights}
                        </p>
                      </div>
                    </div>
                  )}

                  {profile.qualifications_education && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                        <GraduationCap className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-foreground">Education & Training</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                          {profile.qualifications_education}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Host Reviews */}
            <div className="space-y-4 pt-6">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Guest Reviews
              </h2>
              <ReviewList hostId={profile.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
