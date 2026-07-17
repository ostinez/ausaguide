import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Search, LayoutGrid, List, Heart, MapPin, Compass, Globe, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GradientText } from "@/components/ui/GradientText"

import { GlassIcons } from "@/components/ui/GlassIcons"
import { Input } from "@/components/ui/input"
import { PlusSpinner } from "@/components/ui/PlusSpinner"
import { cn } from "@/lib/utils"
import { fetchTours, incrementTourViews } from "@/lib/api/tours"
import { TourCard } from "@/components/ui/TourCard"
import type { Tour } from "@/lib/types"

import {
  getTourFilterTags,
  type FilterTag,
} from "@/lib/tour-utils"
import { fetchWishlist, addToWishlist, removeFromWishlist } from "@/lib/api/wishlist"
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

    // Realtime tours update subscription for all events (INSERT, UPDATE, DELETE)
    /*
    const channel = supabase
      .channel("tours-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tours" },
        async (payload) => {
          console.log("Realtime tours table change received:", payload)
          try {
            const data = await fetchTours()
            setTours(data)
          } catch (err) {
            console.error("Error refreshing tours on realtime update:", err)
          }
        }
      )
      .subscribe()
    */

    return () => {
      // supabase.removeChannel(channel)
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
                    return (
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


