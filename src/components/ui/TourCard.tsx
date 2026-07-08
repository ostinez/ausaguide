import { useNavigate } from "react-router-dom"
import { Clock, Heart, BadgeCheck, MapPin, Star, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SpotlightCard } from "@/components/ui/SpotlightCard"
import type { Tour } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  formatTourPrice,
  getHostInitials,
  formatViews,
  getTourImage,
} from "@/lib/tour-utils"
import { incrementTourViews } from "@/lib/api/tours"

interface TourCardProps {
  tour: Tour
  isWishlisted: boolean
  onToggleWishlist: (tourId: string, isWishlisted: boolean) => void
  onClick?: () => void
  viewMode?: "grid" | "list"
}

export function TourCard({ tour, isWishlisted, onToggleWishlist, onClick, viewMode = "grid" }: TourCardProps) {
  const navigate = useNavigate()
  const typeLabel = tour.tour_type === "virtual" ? "Virtual" : "In-Person"
  const typeColor =
    tour.tour_type === "virtual"
      ? "bg-primary/20 text-primary border-primary/30"
      : "bg-teal/20 text-teal border-teal/30"
  const hostName = tour.host?.full_name ?? "Local Host"
  const hostInitials = getHostInitials(hostName)
  const tourImage = getTourImage(tour)

  const defaultClick = () => {
    incrementTourViews(tour.id).catch(console.error)
    navigate(`/tours/${tour.id}`)
  }

  const isList = viewMode === "list"

  return (
    <SpotlightCard
      spotlightColor="rgba(127, 90, 240, 0.15)"
      className={cn(
        "tour-card group flex cursor-pointer overflow-hidden rounded-xl border border-border bg-card hover:border-primary/50",
        isList ? "flex-col sm:flex-row h-auto sm:h-52" : "flex-col"
      )}
      onClick={onClick || defaultClick}
    >
      <div
        className={cn(
          "relative bg-muted shrink-0 overflow-hidden",
          isList ? "w-full sm:w-[280px] h-48 sm:h-full" : "h-44"
        )}
      >
        <img
          src={tourImage}
          alt={tour.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            typeColor
          )}
        >
          {typeLabel}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onToggleWishlist(tour.id, isWishlisted)
          }}
          className={cn(
            "absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-border/40 bg-background/60 backdrop-blur-sm transition-all hover:bg-background",
            isWishlisted ? "text-rose-500 hover:text-rose-600" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className={cn("size-4", isWishlisted && "fill-current")} />
        </button>

        <span className="absolute right-14 top-3 flex items-center gap-1 rounded-full border border-border/40 bg-background/60 px-2.5 py-0.5 text-xs text-foreground backdrop-blur-sm">
          <Clock className="size-3" />
          {tour.duration_hours}h
        </span>

        {tour.host_id === "11111111-1111-1111-1111-111111111101" && (
          <span className="absolute left-3 bottom-8 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow">
            Featured Tour
          </span>
        )}

        <div className={cn("absolute", isList ? "bottom-3 left-4" : "-bottom-5 left-4")}>
          <Avatar className="size-10 border-2 border-card">
            <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
              {hostInitials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col gap-3 px-4 pb-4", isList ? "pt-4" : "pt-8")}>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{hostName}</span>
          {tour.host?.is_verified && (
            <BadgeCheck className="size-3.5 text-primary" />
          )}
        </div>

        <h3 className={cn("line-clamp-2 font-semibold leading-snug text-foreground transition-colors group-hover:text-primary", isList ? "text-lg" : "text-base")}>
          {tour.title}
        </h3>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          {tour.location_name}
        </div>

        <div className="flex-1" />

        <div className={cn("flex justify-between pt-2 gap-4", isList ? "items-end" : "items-center")}>
          <div className="flex flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-1">
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-primary text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {tour.rating.toFixed(1)}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                ({tour.review_count})
              </span>
              <span className="mx-1 text-muted-foreground/30">·</span>
              <span className="text-xs text-muted-foreground">
                {formatViews(tour.views || 0)}
              </span>
            </div>
            <span className="text-sm font-bold text-foreground whitespace-nowrap">
              {formatTourPrice(tour.price, tour.currency)}{" "}
              <span className="text-xs font-normal text-muted-foreground">/ person</span>
            </span>
          </div>

          <Button size="sm" className="gap-1 rounded-full shrink-0">
            View Tour
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </SpotlightCard>
  )
}
