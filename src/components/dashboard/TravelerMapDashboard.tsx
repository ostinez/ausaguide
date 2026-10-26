import { useState, useMemo } from "react"
import { format, isBefore, parseISO, startOfDay } from "date-fns"
import {
  Calendar,
  Clock,
  TrendingUp,
  Search,
  MapPin,
  ExternalLink,
  MessageSquare,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Booking } from "@/lib/types"
import { TravelerBookingsMap } from "./TravelerBookingsMap"
import { CancelledBookingAlert } from "./CancelledBookingAlert"
import ReviewForm from "@/components/ui/ReviewForm"
import { Link } from "react-router-dom"

interface TravelerMapDashboardProps {
  bookings: Booking[]
  onChat?: (booking: Booking) => void
  onRefresh: () => void
}

export function TravelerMapDashboard({
  bookings = [],
  onChat,
  onRefresh,
}: TravelerMapDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

  const today = startOfDay(new Date())

  // Separate cancelled bookings for prominent alert banners
  const cancelledBookings = useMemo(() => {
    return bookings.filter((b) => b.status === "cancelled")
  }, [bookings])

  // Categorize active & past bookings
  const upcomingBookings = useMemo(() => {
    return bookings.filter(
      (b) => (b.status === "confirmed" || b.status === "pending") && !isBefore(parseISO(b.booking_date), today)
    )
  }, [bookings, today])

  const pastBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.status === "completed" || isBefore(parseISO(b.booking_date), today)
    )
  }, [bookings, today])

  const totalSpent = useMemo(() => {
    return bookings
      .filter((b) => b.status !== "cancelled" && b.status !== "declined")
      .reduce((sum, b) => sum + (b.total_price || 0), 0)
  }, [bookings])

  // Filtered list for the left column
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const title = b.tour?.title?.toLowerCase() || ""
      const location = b.tour?.location_name?.toLowerCase() || ""
      const guest = b.guest_name?.toLowerCase() || ""
      const q = searchQuery.toLowerCase().trim()

      const matchesSearch = !q || title.includes(q) || location.includes(q) || guest.includes(q)

      if (!matchesSearch) return false

      if (statusFilter === "all") return true
      if (statusFilter === "upcoming") {
        return (b.status === "confirmed" || b.status === "pending") && !isBefore(parseISO(b.booking_date), today)
      }
      if (statusFilter === "past") {
        return b.status === "completed" || isBefore(parseISO(b.booking_date), today)
      }
      if (statusFilter === "cancelled") {
        return b.status === "cancelled"
      }
      return b.status === statusFilter
    })
  }, [bookings, searchQuery, statusFilter, today])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── METRIC STAT CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 bg-gradient-to-br from-[#16161A] to-[#1E2028] rounded-2xl shadow-modern">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Upcoming Adventures
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">{upcomingBookings.length}</h3>
            </div>
            <div className="size-10 rounded-xl bg-teal/15 text-teal flex items-center justify-center">
              <Calendar className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-[#16161A] to-[#1E2028] rounded-2xl shadow-modern">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Past Experiences
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">{pastBookings.length}</h3>
            </div>
            <div className="size-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-[#16161A] to-[#1E2028] rounded-2xl shadow-modern">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Total Invested
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">
                KSh {totalSpent.toLocaleString()}
              </h3>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <TrendingUp className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── CANCELLED BOOKINGS ALERT NOTICES (TASK 5) ───────────────────────── */}
      {cancelledBookings.length > 0 && (
        <div className="space-y-3">
          {cancelledBookings.map((b) => (
            <CancelledBookingAlert
              key={b.id}
              booking={b}
              onRefresh={onRefresh}
              onChat={onChat}
            />
          ))}
        </div>
      )}

      {/* ── TOP SEARCH & FILTER BAR ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border border-border/50 bg-[#16161A]/90 backdrop-blur-md shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your tours, destinations, or keywords..."
            className="pl-9 bg-background/50 border-border/40 text-xs sm:text-sm h-10 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Trips" },
            { id: "upcoming", label: "Upcoming" },
            { id: "past", label: "Past" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <Button
              key={tab.id}
              size="sm"
              variant={statusFilter === tab.id ? "default" : "outline"}
              onClick={() => setStatusFilter(tab.id)}
              className={`h-8 text-xs rounded-full px-3 shrink-0 ${
                statusFilter === tab.id
                  ? "bg-brand text-white font-semibold"
                  : "border-border/50 text-muted-foreground hover:text-white"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── SPLIT-SCREEN LAYOUT: LEFT CARDS, RIGHT DARK MAP ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: BOOKINGS LIST (5 COLS) */}
        <div className="lg:col-span-5 space-y-3.5 order-2 lg:order-1 max-h-[700px] overflow-y-auto pr-1">
          {filteredBookings.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground rounded-2xl border border-border/40 bg-card/40 p-6">
              <MapPin className="size-8 mx-auto mb-2 text-muted-foreground/60" />
              <p className="text-sm font-semibold text-white">No tours found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Browse our marketplace to find genuine local Kenyan adventures!
              </p>
              <Link to="/tours" className="inline-block mt-4">
                <Button size="sm" className="bg-brand text-white text-xs rounded-full">
                  Explore Tours
                </Button>
              </Link>
            </div>
          ) : (
            filteredBookings.map((b) => {
              const isSelected = selectedBookingId === b.id
              const tour = b.tour

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBookingId(b.id)}
                  className={`group p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-brand bg-brand/10 shadow-neo-pill"
                      : "border-border/60 bg-[#16161A]/90 hover:border-brand/40 hover:bg-[#1A1D24]"
                  }`}
                >
                  <div className="flex gap-3.5">
                    {tour?.images?.[0] ? (
                      <img
                        src={tour.images[0]}
                        alt={tour.title}
                        className="size-16 rounded-xl object-cover shrink-0 border border-border/30"
                      />
                    ) : (
                      <div className="size-16 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                        <MapPin className="size-6 text-muted-foreground/40" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-white text-sm leading-snug line-clamp-1 group-hover:text-brand transition-colors">
                          {tour?.title || "Tour Booking"}
                        </h4>
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize px-2 py-0 shrink-0 font-semibold ${
                            b.status === "confirmed"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : b.status === "pending"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : b.status === "completed"
                              ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                              : "bg-zinc-500/20 text-zinc-300 border-zinc-500/40"
                          }`}
                        >
                          {b.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-3 text-brand shrink-0" />
                        <span className="truncate">{tour?.location_name || "Kenya"}</span>
                      </p>

                      <div className="flex items-center justify-between text-xs pt-1 text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-white">
                          <Calendar className="size-3 text-brand" />
                          {format(parseISO(b.booking_date), "MMM d, yyyy")}
                        </span>
                        <span className="font-semibold text-white">
                          {b.currency || "KES"} {b.total_price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons row */}
                  <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-border/40">
                    {onChat && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          onChat(b)
                        }}
                        className="h-7 text-[11px] rounded-full text-muted-foreground hover:text-white"
                      >
                        <MessageSquare className="size-3 mr-1" />
                        Host Chat
                      </Button>
                    )}

                    {/* Review Form - enabled for completed or cancelled bookings */}
                    {(b.status === "completed" || b.status === "cancelled") && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <ReviewForm
                          bookingId={b.id}
                          bookingStatus={b.status}
                          tourId={b.tour_id}
                          hostId={b.host_id}
                          travelerId={localStorage.getItem("user_id") ?? b.guest_id ?? undefined}
                          triggerVariant="outline"
                          triggerSize="sm"
                          triggerClassName="h-7 text-[11px] rounded-full border-border/60 hover:border-amber-400 text-amber-400 hover:text-amber-300"
                          onSuccess={onRefresh}
                        />
                      </div>
                    )}

                    {tour?.id && (
                      <Link to={`/tours/${tour.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] rounded-full text-brand hover:underline"
                        >
                          View Details <ExternalLink className="size-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* RIGHT COLUMN: DARK INTERACTIVE MAP (7 COLS) */}
        <div className="lg:col-span-7 order-1 lg:order-2 sticky top-6">
          <TravelerBookingsMap
            bookings={bookings}
            selectedBookingId={selectedBookingId}
            onSelectBooking={(id) => setSelectedBookingId(id)}
            className="h-[480px] lg:h-[680px] w-full rounded-2xl overflow-hidden border border-border/50 shadow-modern"
          />
        </div>
      </div>
    </div>
  )
}
