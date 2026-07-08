import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Star, Search, LayoutGrid, List, Heart, MapPin, ArrowRight, Compass, Globe, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GradientText } from "@/components/ui/GradientText"

import { GlassIcons } from "@/components/ui/GlassIcons"
import { Input } from "@/components/ui/input"
import { PlusSpinner } from "@/components/ui/PlusSpinner"
import { cn } from "@/lib/utils"
import { fetchTours, incrementTourViews } from "@/lib/api/tours"
import { TourCard } from "@/components/ui/TourCard"
import TiltedCard from "@/components/ui/TiltedCard"
import type { Tour } from "@/lib/types"

import {
  getTourFilterTags,
  type FilterTag,
  formatTourPrice,
} from "@/lib/tour-utils"
import { fetchWishlist, addToWishlist, removeFromWishlist } from "@/lib/api/wishlist"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { useSEO } from "@/hooks/useSEO"
import { JsonLd } from "@/components/seo/JsonLd"

type TypeFilter = "all" | FilterTag
type PriceFilter = "all" | "under4000" | "4000to8000" | "8000plus"



const PRICE_FILTERS: { label: string; value: PriceFilter }[] = [
  { label: "Under KES 4,000", value: "under4000" },
  { label: "KES 4,000–8,000", value: "4000to8000" },
  { label: "KES 8,000+", value: "8000plus" },
]

function matchesPrice(price: number, filter: PriceFilter): boolean {
  if (filter === "all") return true
  if (filter === "under4000") return price < 4000
  if (filter === "4000to8000") return price >= 4000 && price <= 8000
  return price > 8000
}


export default function ToursPage() {
  useSEO({
    title: "Explore Local Tours in Kenya",
    description:
      "Browse live and in-person tours guided by real local experts across Kenya.",
    url: "https://ausaguide.com/tours",
  })
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState(searchParams.get("search") ?? "")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("tours_view_mode")
    return (saved === "list" || saved === "grid") ? saved : "grid"
  })

  const glassItems = [
    {
      icon: <Compass size={20} />,
      color: "purple",
      label: "All Tours",
      active: typeFilter === "all",
      onClick: () => setTypeFilter("all"),
    },
    {
      icon: <Globe size={20} />,
      color: "blue",
      label: "Virtual",
      active: typeFilter === "virtual",
      onClick: () => setTypeFilter("virtual"),
    },
    {
      icon: <Users size={20} />,
      color: "green",
      label: "In-Person",
      active: typeFilter === "in-person",
      onClick: () => setTypeFilter("in-person"),
    },
    {
      icon: <MapPin size={20} />,
      color: "orange",
      label: "Walking",
      active: typeFilter === "walking",
      onClick: () => setTypeFilter("walking"),
    },
    {
      icon: <Heart size={20} />,
      color: "red",
      label: "Food",
      active: typeFilter === "food",
      onClick: () => setTypeFilter("food"),
    },
    {
      icon: <Sparkles size={20} />,
      color: "teal",
      label: "Nature",
      active: typeFilter === "nature",
      onClick: () => setTypeFilter("nature"),
    },
  ]

  const toggleViewMode = (mode: "grid" | "list") => {
    setViewMode(mode)
    localStorage.setItem("tours_view_mode", mode)
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [typeFilter, priceFilter, query])

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

  useEffect(() => {
    fetchTours()
      .then((data) => {
        setTours(data)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))

    // Realtime views updates
    const channel = supabase
      .channel("tours-views-realtime")
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

  const handleToggleWishlist = async (tourId: string, isWishlisted: boolean) => {
    if (!userId) {
      toast.error("Please log in as a traveler to save tours to your wishlist.")
      navigate("/auth")
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

  const filtered = tours.filter((tour) => {
    const tags = getTourFilterTags(tour)
    const matchesType = typeFilter === "all" || tags.includes(typeFilter as FilterTag)
    const matchesPriceFilter = matchesPrice(tour.price, priceFilter)
    const matchesQuery =
      query.trim() === "" ||
      tour.title.toLowerCase().includes(query.toLowerCase()) ||
      tour.location_name.toLowerCase().includes(query.toLowerCase())
    return matchesType && matchesPriceFilter && matchesQuery
  })

  const ITEMS_PER_PAGE = 6
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const displayedTours = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )



  return (
    <div className="relative overflow-hidden min-h-screen bg-background">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": filtered.map((tour, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "url": `https://ausaguide.com/tours/${tour.id}`,
            "name": tour.title
          }))
        }}
      />
      <div className="relative px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-foreground">
            <GradientText
              colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]}
              animationSpeed={4}
              yoyo={true}
            >
              Explore Tours
            </GradientText>
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Discover Kenya through the eyes of locals — virtual or in-person.
          </p>

          <div className="relative mt-6 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tours or destinations..."
              className="h-11 rounded-full pl-9 pr-4 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2">
              <GlassIcons items={glassItems} className="mb-2" />
            </div>

            <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

            <div className="flex flex-wrap gap-2">
              {PRICE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() =>
                    setPriceFilter(priceFilter === f.value ? "all" : f.value)
                  }
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    priceFilter === f.value
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* View Switcher Toggle */}
          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 self-start sm:self-center shrink-0">
            <button
              onClick={() => toggleViewMode("grid")}
              className={cn(
                "rounded-full p-1.5 transition-all duration-200 cursor-pointer",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground shadow shadow-primary/20 scale-105"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Grid View"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => toggleViewMode("list")}
              className={cn(
                "rounded-full p-1.5 transition-all duration-200 cursor-pointer",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground shadow shadow-primary/20 scale-105"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="List View"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-16 flex flex-col items-center gap-3">
            <PlusSpinner size={48} />
            <p className="text-sm text-muted-foreground">Loading tours...</p>
          </div>
        ) : error ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <p className="text-lg font-semibold text-foreground">Could not load tours</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <>

            <p className="mt-6 text-sm text-muted-foreground">
              {filtered.length} tour{filtered.length !== 1 ? "s" : ""} found
            </p>

            {displayedTours.length > 0 ? (
              <>
                <div className={cn(
                  "mt-4",
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    : "flex flex-col gap-6"
                )}>
                  {displayedTours.map((tour) => {
                    const isWishlisted = wishlist.has(tour.id)
                    const typeLabel = tour.tour_type === "virtual" ? "Virtual" : "In-Person"
                    const typeColor = tour.tour_type === "virtual"
                      ? "bg-[#7F5AF0]/20 text-[#7F5AF0] border-[#7F5AF0]/30"
                      : "bg-[#2CB67D]/20 text-[#2CB67D] border-[#2CB67D]/30"
                    
                    const overlayContent = (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-[#16161A] via-[#16161A]/60 to-transparent p-5 flex flex-col justify-between rounded-[15px] border border-border text-white pointer-events-none">
                        {/* Top: Badges and Wishlist */}
                        <div className="flex items-center justify-between pointer-events-auto">
                          <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm", typeColor)}>
                            {typeLabel}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              handleToggleWishlist(tour.id, isWishlisted)
                            }}
                            className={cn(
                              "flex size-8 items-center justify-center rounded-full border border-border bg-black/60 backdrop-blur-sm transition-all hover:bg-black/80 cursor-pointer",
                              isWishlisted ? "text-rose-500 hover:text-rose-600" : "text-white/60 hover:text-white"
                            )}
                          >
                            <Heart className={cn("size-4", isWishlisted && "fill-current")} />
                          </button>
                        </div>

                        {/* Bottom Info Section */}
                        <div className="space-y-2 pointer-events-auto">
                          <div className="flex items-center gap-1 text-xs text-white/50">
                            <MapPin className="size-3 text-[#2CB67D]" />
                            <span className="truncate">{tour.location_name}</span>
                          </div>
                          
                          <h3 className="line-clamp-2 font-bold leading-snug text-white text-base">
                            {tour.title}
                          </h3>

                          <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-white/40">
                                <span className="flex items-center gap-0.5">
                                  <Star className="size-3.5 fill-[#7F5AF0] text-[#7F5AF0]" />
                                  <span className="font-bold text-white text-xs">{tour.rating.toFixed(1)}</span>
                                </span>
                                <span>({tour.review_count})</span>
                                <span>·</span>
                                <span>{tour.duration_hours}h</span>
                              </div>
                              <span className="text-sm font-black text-white whitespace-nowrap mt-1">
                                {formatTourPrice(tour.price, tour.currency)}{" "}
                                <span className="text-[10px] font-normal text-white/40">/ person</span>
                              </span>
                            </div>

                            <Button
                              size="sm"
                              className="gap-1 rounded-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white border-0 hover:opacity-95 shadow shadow-[#7F5AF0]/10 shrink-0 text-xs px-4 h-8 font-bold"
                            >
                              View
                              <ArrowRight className="size-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )

                    return viewMode === "grid" ? (
                      <TiltedCard
                        key={tour.id}
                        imageSrc={tour.images?.[0] || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80"}
                        altText={tour.title}
                        captionText={`${tour.title} - ${tour.location_name}`}
                        containerHeight="400px"
                        containerWidth="100%"
                        imageHeight="350px"
                        imageWidth="100%"
                        scaleOnHover={1.05}
                        rotateAmplitude={12}
                        showMobileWarning={true}
                        showTooltip={false}
                        displayOverlayContent={true}
                        overlayContent={overlayContent}
                        onClick={() => {
                          incrementTourViews(tour.id).catch(console.error)
                          navigate(`/tours/${tour.id}`)
                        }}
                      />
                    ) : (
                      <TourCard
                        key={tour.id}
                        tour={tour}
                        viewMode={viewMode}
                        isWishlisted={isWishlisted}
                        onToggleWishlist={handleToggleWishlist}
                        onClick={() => {
                          incrementTourViews(tour.id).catch(console.error)
                          navigate(`/tours/${tour.id}`)
                        }}
                      />
                    )
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <Pagination>
                      <PaginationContent className="gap-2">
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              if (currentPage > 1) setCurrentPage(currentPage - 1)
                            }}
                            className={cn(
                              "cursor-pointer rounded-full border border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground transition-all duration-200",
                              currentPage === 1 && "pointer-events-none opacity-50"
                            )}
                          />
                        </PaginationItem>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              href="#"
                              isActive={pageNumber === currentPage}
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(pageNumber)
                              }}
                              className={cn(
                                "cursor-pointer rounded-full w-10 h-10 transition-all duration-200",
                                pageNumber === currentPage
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary shadow-lg shadow-primary/20 scale-105 font-bold"
                                  : "bg-card text-muted-foreground border border-border hover:border-primary/60 hover:text-foreground"
                              )}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                            }}
                            className={cn(
                              "cursor-pointer rounded-full border border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground transition-all duration-200",
                              currentPage === totalPages && "pointer-events-none opacity-50"
                            )}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-16 flex flex-col items-center gap-3 text-center">
                <p className="text-lg font-semibold text-foreground">No tours found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search query.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTypeFilter("all")
                    setPriceFilter("all")
                    setQuery("")
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


