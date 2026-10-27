import { useEffect, useState, useMemo, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Search,
  Compass,
  Users,
  MapPin,
  X,
  Award,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TourCard } from "@/components/ui/TourCard"
import { SkeletonTourGrid } from "@/components/ui/Skeleton"
import { supabase } from "@/lib/supabase"
import type { Tour } from "@/lib/types"
import { fetchWishlist, addToWishlist, removeFromWishlist } from "@/lib/api/wishlist"
import { useSEO } from "@/hooks/useSEO"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ErrorState } from "@/components/ui/ErrorState"
import { logErrorToDatabase } from "@/lib/errorLogger"

interface HostProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  role: string | null
  host_tier: string | null
  verified_guide: boolean | null
  is_verified: boolean | null
  languages?: string[] | null
  rating?: number | null
  is_private?: boolean | null
}

interface PlaceItem {
  name: string
  count: number
  imageUrl?: string
}

export default function ExplorePage() {
  useSEO({
    title: "Search & Discover Kenya Tours, Local Hosts, and Destinations | Ausaguide",
    description: "Explore Kenya with authentic local hosts. Search curated tours, certified safari guides, and hidden gems across Nairobi, Maasai Mara, Diani, and beyond.",
    url: "https://ausaguide.com/explore",
  })

  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentTab = (searchParams.get("tab") as "tours" | "hosts" | "places") || "tours"
  const currentQuery = searchParams.get("q") || ""
  const selectedPlace = searchParams.get("place") || ""

  const [searchQuery, setSearchQuery] = useState(currentQuery)
  const [activeTab, setActiveTab] = useState<"tours" | "hosts" | "places">(currentTab)
  
  // Data states
  const [tours, setTours] = useState<Tour[]>([])
  const [hosts, setHosts] = useState<HostProfile[]>([])
  const [places, setPlaces] = useState<PlaceItem[]>([])
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null

  // Sync state with URL params
  useEffect(() => {
    const tab = searchParams.get("tab") as "tours" | "hosts" | "places"
    if (tab && ["tours", "hosts", "places"].includes(tab)) {
      setActiveTab(tab)
    }
    const q = searchParams.get("q")
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q)
    }
  }, [searchParams])

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    setSearchParams(newParams, { replace: true })
  }

  // Load initial dataset: Tours, Hosts, Places, Following
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
        // 1. Fetch current user's accepted following IDs for privacy gate
        if (currentUserId) {
          const { data: followsData } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", currentUserId)
            .eq("status", "accepted")

          if (followsData) {
            setFollowingIds(new Set(followsData.map((f) => f.following_id)))
          }

          // Fetch wishlist
          try {
            const wList = await fetchWishlist(currentUserId)
            setWishlistIds(new Set(wList.map((item) => item.tour_id)))
          } catch (e) {
            console.warn("Wishlist fetch error:", e)
          }
        }

        // 2. Fetch published Tours with host profile
        const { data: toursData, error: toursErr } = await supabase
          .from("tours")
          .select("*, host:profiles!tours_host_id_fkey(id, full_name, avatar_url, host_tier, role, is_private, is_verified)")
          .eq("is_published", true)
          .order("created_at", { ascending: false })

        if (toursErr) throw toursErr

        // Privacy check on tours: host must not be private (or host is public)
        const publicTours = (toursData || []).filter((t: any) => {
          const host = t.host
          if (!host) return true
          // If host is private, traveler can only see if following or is the host
          if (host.is_private) {
            return currentUserId === host.id || followingIds.has(host.id)
          }
          return true
        }) as Tour[]

        setTours(publicTours)

        // 3. Extract unique places from tours
        const placeCountMap: Record<string, number> = {}
        const placeImageMap: Record<string, string> = {}

        for (const tour of publicTours) {
          const loc = tour.location_name || (tour as any).location
          if (loc && typeof loc === "string") {
            const cleanLoc = loc.trim()
            placeCountMap[cleanLoc] = (placeCountMap[cleanLoc] || 0) + 1
            if (!placeImageMap[cleanLoc] && tour.images && tour.images.length > 0) {
              placeImageMap[cleanLoc] = tour.images[0]
            }
          }
        }

        const extractedPlaces: PlaceItem[] = Object.entries(placeCountMap)
          .map(([name, count]) => ({
            name,
            count,
            imageUrl: placeImageMap[name],
          }))
          .sort((a, b) => b.count - a.count)

        setPlaces(extractedPlaces)

        // 4. Fetch Hosts (role = host or guide), privacy checked
        const { data: hostsData, error: hostsErr } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, bio, location, role, host_tier, verified_guide, is_verified, languages, rating, is_private")
          .in("role", ["host", "guide"])
          .limit(100)

        if (hostsErr) throw hostsErr

        // Privacy check: only show public hosts, or followed if private
        const filteredHosts = (hostsData || []).filter((h) => {
          if (h.is_private) {
            return currentUserId === h.id || followingIds.has(h.id)
          }
          return true
        })

        setHosts(filteredHosts)
      } catch (err: any) {
        logErrorToDatabase("explore_page_fetch", err, {
          currentUserId,
          activeTab,
          searchQuery,
        })
        setError("We couldn't load the tours right now. Please check your connection or try again later.")
      } finally {
        setLoading(false)
      }
  }, [currentUserId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Toggle wishlist
  const handleToggleWishlist = async (tourId: string, currentStatus: boolean) => {
    if (!currentUserId) {
      toast.error("Please login to save tours to your wishlist")
      navigate("/auth")
      return
    }

    try {
      if (currentStatus) {
        await removeFromWishlist(currentUserId, tourId)
        setWishlistIds((prev) => {
          const next = new Set(prev)
          next.delete(tourId)
          return next
        })
        toast.success("Removed from wishlist")
      } else {
        await addToWishlist(currentUserId, tourId)
        setWishlistIds((prev) => new Set([...prev, tourId]))
        toast.success("Added to wishlist")
      }
    } catch {
      toast.error("Could not update wishlist")
    }
  }

  // Filtered tours
  const filteredTours = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const place = selectedPlace.toLowerCase().trim()

    return tours.filter((t) => {
      // Place filter
      if (place) {
        const tourLoc = (t.location_name || (t as any).location || "").toLowerCase()
        if (!tourLoc.includes(place)) return false
      }

      // Query filter: title, description, category, location
      if (q) {
        const title = (t.title || "").toLowerCase()
        const desc = (t.description || "").toLowerCase()
        const cat = (t.category || "").toLowerCase()
        const loc = (t.location_name || (t as any).location || "").toLowerCase()
        const hostName = (t.host?.full_name || "").toLowerCase()
        return (
          title.includes(q) ||
          desc.includes(q) ||
          cat.includes(q) ||
          loc.includes(q) ||
          hostName.includes(q)
        )
      }

      return true
    })
  }, [tours, searchQuery, selectedPlace])

  // Filtered hosts
  const filteredHosts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return hosts

    return hosts.filter((h) => {
      const name = (h.full_name || "").toLowerCase()
      const bio = (h.bio || "").toLowerCase()
      const loc = (h.location || "").toLowerCase()
      const tier = (h.host_tier || "").toLowerCase()
      return name.includes(q) || bio.includes(q) || loc.includes(q) || tier.includes(q)
    })
  }, [hosts, searchQuery])

  // Filtered places
  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return places
    return places.filter((p) => p.name.toLowerCase().includes(q))
  }, [places, searchQuery])

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 pt-6 sm:pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* ── Page Header & Search Bar ───────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Explore <span className="text-primary">Kenya</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Search verified local hosts, authentic experiences, safaris, and places across Kenya.
          </p>

          {/* Top Search Bar */}
          <div className="relative mt-6 max-w-2xl mx-auto">
            <div className="relative flex items-center shadow-lg rounded-2xl bg-card border border-border/80 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="absolute left-4 size-5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  updateParam("q", e.target.value)
                }}
                placeholder={
                  activeTab === "tours"
                    ? "Search tours by title, description, category, or city..."
                    : activeTab === "hosts"
                    ? "Search hosts by name, bio, languages, or location..."
                    : "Search Kenya destinations, parks, and places..."
                }
                className="w-full pl-11 pr-10 py-6 text-sm sm:text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("")
                    updateParam("q", "")
                  }}
                  className="absolute right-3.5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── 3 Tabs (Tours, Hosts, Places) ─────────────────────────────── */}
        <div className="flex items-center justify-center border-b border-border/60 pb-1">
          <div className="inline-flex rounded-xl bg-muted/50 p-1.5 gap-1.5 border border-border/40">
            <button
              type="button"
              onClick={() => {
                setActiveTab("tours")
                updateParam("tab", "tours")
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer",
                activeTab === "tours"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/60"
              )}
            >
              <Compass className="size-4" />
              <span>Tours</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-black/20 text-white">
                {tours.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("hosts")
                updateParam("tab", "hosts")
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer",
                activeTab === "hosts"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/60"
              )}
            >
              <Users className="size-4" />
              <span>Hosts</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-black/20 text-white">
                {hosts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("places")
                updateParam("tab", "places")
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer",
                activeTab === "places"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/60"
              )}
            >
              <MapPin className="size-4" />
              <span>Places</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-black/20 text-white">
                {places.length}
              </span>
            </button>
          </div>
        </div>

        {/* ── Place Pill Tags (Quick Filter for Tours) ─────────────────── */}
        {places.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" />
                Popular Kenya Locations:
              </span>
              {selectedPlace && (
                <button
                  type="button"
                  onClick={() => updateParam("place", "")}
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <X className="size-3" /> Clear location filter
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => updateParam("place", "")}
                className={cn(
                  "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  !selectedPlace
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                )}
              >
                All Locations
              </button>
              {places.map((place) => (
                <button
                  key={place.name}
                  type="button"
                  onClick={() => {
                    const next = selectedPlace === place.name ? "" : place.name
                    updateParam("place", next)
                    if (activeTab === "places") {
                      setActiveTab("tours")
                      updateParam("tab", "tours")
                    }
                  }}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                    selectedPlace === place.name
                      ? "bg-primary text-primary-foreground border-primary font-semibold"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  )}
                >
                  <span>{place.name}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    selectedPlace === place.name ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {place.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Active Filter Bar summary ─────────────────────────────────── */}
        {(searchQuery || selectedPlace) && (
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-xl border border-border/50">
            <span className="font-semibold text-foreground">Active Filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                "{searchQuery}"
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("")
                    updateParam("q", "")
                  }}
                  className="hover:opacity-75"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {selectedPlace && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <MapPin className="size-2.5" />
                {selectedPlace}
                <button
                  type="button"
                  onClick={() => updateParam("place", "")}
                  className="hover:opacity-75"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                updateParam("q", "")
                updateParam("place", "")
              }}
              className="text-xs text-primary underline ml-auto font-medium hover:opacity-80"
            >
              Reset All
            </button>
          </div>
        )}

        {/* ── Tab 1: Tours Content ────────────────────────────────────── */}
        {activeTab === "tours" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground font-medium">
              <span>
                Showing <strong>{filteredTours.length}</strong> {filteredTours.length === 1 ? "tour" : "tours"}
              </span>
            </div>

            {loading ? (
              <SkeletonTourGrid count={6} />
            ) : error ? (
              <div className="py-12 max-w-lg mx-auto">
                <ErrorState
                  title="Could not load tours"
                  message={error}
                  onRetry={loadData}
                  showSupportButton={true}
                />
              </div>
            ) : filteredTours.length === 0 ? (
              <div className="text-center py-16 px-4 bg-card/60 rounded-2xl border border-border/60 max-w-lg mx-auto space-y-3">
                <Compass className="size-12 mx-auto text-muted-foreground/50 animate-pulse" />
                <h3 className="text-lg font-bold text-foreground">No tours matched your search</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Try adjusting your search terms or clearing your location filter to discover more Kenya adventures.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    updateParam("q", "")
                    updateParam("place", "")
                  }}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTours.map((tour) => (
                  <TourCard
                    key={tour.id}
                    tour={tour}
                    isWishlisted={wishlistIds.has(tour.id)}
                    onToggleWishlist={handleToggleWishlist}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 2: Hosts Content ────────────────────────────────────── */}
        {activeTab === "hosts" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground font-medium">
              <span>
                Showing <strong>{filteredHosts.length}</strong> {filteredHosts.length === 1 ? "host" : "hosts"}
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 rounded-2xl bg-muted/40 animate-pulse border border-border" />
                ))}
              </div>
            ) : filteredHosts.length === 0 ? (
              <div className="text-center py-16 px-4 bg-card/60 rounded-2xl border border-border/60 max-w-lg mx-auto space-y-3">
                <Users className="size-12 mx-auto text-muted-foreground/50 animate-pulse" />
                <h3 className="text-lg font-bold text-foreground">No hosts matched your search</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Try searching by host first name, safari specialty, or town.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    updateParam("q", "")
                  }}
                  className="mt-2"
                >
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHosts.map((host) => {
                  const isGuide = host.host_tier === "certified_guide" || host.role === "guide"
                  return (
                    <div
                      key={host.id}
                      className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs hover:shadow-lg hover:border-primary/40 transition-all duration-200"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start gap-3.5">
                          <Avatar className="size-14 border-2 border-primary/20 shrink-0">
                            {host.avatar_url && (
                              <AvatarImage src={host.avatar_url} alt={host.full_name || "Host"} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                              {(host.full_name || "H").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-base text-foreground truncate max-w-[170px]">
                                {host.full_name || "Local Host"}
                              </h3>
                              {(host.verified_guide || host.is_verified) && (
                                <span title="Verified Host">
                                  <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                                </span>
                              )}
                            </div>

                            {/* Role / Tier badge */}
                            <div className="mt-1 flex items-center gap-1.5">
                              {isGuide ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <Award className="size-2.5" />
                                  Certified Guide
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                  Local Host
                                </span>
                              )}
                            </div>

                            {host.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 truncate">
                                <MapPin className="size-3 shrink-0" />
                                <span className="truncate">{host.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bio */}
                        {host.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                            {host.bio}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-4 mt-4 border-t border-border/50 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs font-semibold rounded-xl"
                          onClick={() => navigate(`/hosts/${host.id}`)}
                        >
                          View Profile
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 text-xs font-semibold rounded-xl bg-primary text-primary-foreground gap-1.5"
                          onClick={() => navigate(`/messages?user=${host.id}`)}
                        >
                          <MessageSquare className="size-3.5" />
                          Message
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: Places Content ────────────────────────────────────── */}
        {activeTab === "places" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground font-medium">
              <span>
                Discovered <strong>{filteredPlaces.length}</strong> unique destinations across Kenya
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-32 rounded-2xl bg-muted/40 animate-pulse border border-border" />
                ))}
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="text-center py-16 px-4 bg-card/60 rounded-2xl border border-border/60 max-w-lg mx-auto space-y-3">
                <MapPin className="size-12 mx-auto text-muted-foreground/50 animate-pulse" />
                <h3 className="text-lg font-bold text-foreground">No places matched your search</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Try searching for Nairobi, Mombasa, Mara, Diani, or Naivasha.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPlaces.map((place) => (
                  <div
                    key={place.name}
                    onClick={() => {
                      updateParam("place", place.name)
                      setActiveTab("tours")
                      updateParam("tab", "tours")
                    }}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer min-h-[140px]"
                  >
                    {place.imageUrl && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-15 group-hover:opacity-25 transition-opacity"
                        style={{ backgroundImage: `url(${place.imageUrl})` }}
                      />
                    )}
                    <div className="relative z-10 flex items-start justify-between">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <MapPin className="size-5" />
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-card/90 text-foreground border border-border shadow-2xs">
                        {place.count} {place.count === 1 ? "tour" : "tours"}
                      </span>
                    </div>

                    <div className="relative z-10 mt-4">
                      <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        {place.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <span>Explore tours</span>
                        <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
