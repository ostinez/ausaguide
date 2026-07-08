import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Users,
  BadgeCheck,
  CheckCircle2,
  Globe,
  Wifi,
  Minus,
  Plus,
  CalendarDays,
  Shield,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlareHover } from "@/components/ui/GlareHover"
import { StarBorder } from "@/components/ui/StarBorder"
import ReviewList from "@/components/ui/ReviewList"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { PlusSpinner } from "@/components/ui/PlusSpinner"
import LaserFlow from "@/components/ui/LaserFlow"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { fetchTourById } from "@/lib/api/tours"
import { fetchBookingsByGuestId, fetchProfileByRole } from "@/lib/api/hosts"
import { fetchHostAvailability, fetchHostSettings } from "@/lib/api/availability"
import { trackEvent } from "@/lib/posthog"
import type { Tour, Booking, HostAvailability, HostSettings } from "@/lib/types"
import { formatTourPrice, getHostInitials, getTourImage } from "@/lib/tour-utils"
import { addDays } from "date-fns"
import { useSEO } from "@/hooks/useSEO"
import { JsonLd } from "@/components/seo/JsonLd"

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dynamic SEO — updates as soon as tour loads
  useSEO({
    title: tour ? `${tour.title} | Live Tour in Kenya` : "Tour Details",
    description: tour?.description || "Explore a unique live tour experience in Kenya with real local guides.",
    image: tour?.images?.[0] || "https://ausaguide.com/og-image.png",
    url: `https://ausaguide.com/tours/${id}`,
    type: "article",
  })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined)
  const [guests, setGuests] = useState(1)
  const [userBooking, setUserBooking] = useState<Booking | null>(null)
  const [tourBookings, setTourBookings] = useState<Booking[]>([])
  const [hostAvailability, setHostAvailability] = useState<HostAvailability[]>([])
  const [hostSettings, setHostSettings] = useState<HostSettings | null>(null)

  // Reset selectedTime when date changes
  useEffect(() => {
    setSelectedTime(undefined)
  }, [selectedDate])

  useEffect(() => {
    async function checkUserBooking() {
      try {
        const traveler = await fetchProfileByRole("traveler")
        if (traveler && id) {
          const bookings = await fetchBookingsByGuestId(traveler.id)
          const matched = bookings.find((b) => b.tour_id === id)
          if (matched) {
            setUserBooking(matched)
          }
        }
      } catch (err) {
        console.error("Failed to check traveler bookings", err)
      }
    }
    checkUserBooking()
  }, [id])

  useEffect(() => {
    if (!id) return

    setLoading(true)
    fetchTourById(id)
      .then(async (t) => {
        setTour(t)
        if (t) {
          trackEvent("tour_viewed", {
            tour_id: t.id,
            title: t.title,
            host_id: t.host_id,
            price: t.price,
            category: t.category,
            tour_type: t.tour_type,
          })
          // Increment views count in database
          const newViews = (t.views || 0) + 1
          supabase
            .from("tours")
            .update({ views: newViews })
            .eq("id", t.id)
            .then(({ error }) => {
              if (error) console.error("Failed to increment tour views:", error)
            })

          const [avs, sets] = await Promise.all([
            fetchHostAvailability(t.host_id),
            fetchHostSettings(t.host_id)
          ])
          setHostAvailability(avs)
          setHostSettings(sets)

          // Fetch all bookings for this tour to grey out fully booked slots
          const { data } = await supabase.from("bookings").select("booking_date, booking_time, status, guest_count").eq("tour_id", t.id)
          if (data) {
            setTourBookings(data as unknown as Booking[])
          }
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <PlusSpinner size={52} />
        <p className="text-sm text-muted-foreground">Loading tour...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <p className="text-xl font-semibold">Could not load tour</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link to="/tours">
          <Button variant="outline">Back to Tours</Button>
        </Link>
      </div>
    )
  }

  if (!tour) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <p className="text-xl font-semibold">Tour not found</p>
        <Link to="/tours">
          <Button variant="outline">Back to Tours</Button>
        </Link>
      </div>
    )
  }

  const isVirtual = tour.tour_type === "virtual"
  const typeLabel = isVirtual ? "Virtual" : "In-Person"
  const hostName = tour.host?.full_name ?? "Local Host"
  const hostInitials = getHostInitials(hostName)
  const total = selectedDate ? tour.price * guests : null

  // Auth guard — consistent with rest of app (localStorage pattern)
  const isAuthenticated = !!localStorage.getItem("user_id")

  function handleBookNow() {
    if (!isAuthenticated) {
      navigate("/auth?redirect=" + encodeURIComponent(`/tours/${id}`) + "&message=book")
      return
    }
    if (!selectedDate || !tour || !selectedTime) return
    const dateStr = selectedDate.toISOString().slice(0, 10)
    navigate(`/checkout/${tour.id}?date=${dateStr}&time=${selectedTime}&guests=${guests}`)
  }

  function handleJoinWaitlist() {
    if (!isAuthenticated) {
      navigate("/auth?redirect=" + encodeURIComponent(`/tours/${id}`) + "&message=book")
      return
    }
    if (!selectedDate || !tour) return
    const autoBook = window.confirm("Do you want to automatically book this slot if it becomes available? (Payment will be captured upon booking)")
    alert(`Added to waiting list for ${selectedDate.toDateString()}! Auto-book: ${autoBook ? "Yes" : "No"}`)
  }

  // Host status and availability logic
  const isHostBusy = hostSettings?.is_busy || false
  const hostBusyReason = hostSettings?.busy_reason || "Currently busy"
  
  function getDayStatus(date: Date): "available" | "fully_booked" | "unavailable" {
    const day = date.getDay()
    
    // Check if the day is in the host's availability schedule
    // If the schedule is empty, we assume everyday is available to avoid completely blocking mock data
    let slots = hostAvailability.filter(a => a.day_of_week === day)
    if (hostAvailability.length > 0 && slots.length === 0) {
      return "unavailable"
    }
    
    if (hostAvailability.length === 0) {
      slots = [
        { id: "default-1", host_id: tour?.host_id || "", day_of_week: day, start_time: "09:00:00", end_time: "12:00:00", guest_limit: tour?.max_guests || 5 },
        { id: "default-2", host_id: tour?.host_id || "", day_of_week: day, start_time: "14:00:00", end_time: "17:00:00", guest_limit: tour?.max_guests || 5 }
      ]
    }

    const dateStr = date.toISOString().slice(0, 10)
    
    // A day is "fully_booked" if ALL of its individual slots are fully booked
    let allSlotsBooked = true
    let hasSlots = false
    
    for (const slot of slots) {
      hasSlots = true
      const timeStr = slot.start_time.substring(0, 5)
      const bookingsAtTime = tourBookings.filter(b => 
        b.booking_date === dateStr && 
        b.booking_time?.substring(0, 5) === timeStr &&
        (b.status === "confirmed" || b.status === "pending")
      )
      const guestsBooked = bookingsAtTime.reduce((sum, b) => sum + b.guest_count, 0)
      const maxLimit = tour!.max_guests || slot.guest_limit || 1
      if (guestsBooked + guests <= maxLimit) {
        allSlotsBooked = false
        break
      }
    }
    
    if (hasSlots && allSlotsBooked) {
      return "fully_booked"
    }

    return "available"
  }

  function getTimeSlots(): { time: string; isAvailable: boolean; guestsBooked: number; maxLimit: number; endTime: string }[] {
    if (!selectedDate || !tour) return []
    const day = selectedDate.getDay()
    const dateStr = selectedDate.toISOString().slice(0, 10)
    
    // Find slots from hostAvailability
    let slots = hostAvailability.filter(a => a.day_of_week === day)
    
    // If no availability is defined at all for the host, seed default slots
    if (hostAvailability.length === 0) {
      slots = [
        { id: "default-1", host_id: tour.host_id, day_of_week: day, start_time: "09:00:00", end_time: "12:00:00", guest_limit: tour.max_guests },
        { id: "default-2", host_id: tour.host_id, day_of_week: day, start_time: "14:00:00", end_time: "17:00:00", guest_limit: tour.max_guests }
      ]
    }
    
    return slots.map(slot => {
      const timeStr = slot.start_time.substring(0, 5) // "HH:MM"
      const endTimeStr = slot.end_time.substring(0, 5) // "HH:MM"
      // Calculate bookings at this time
      const bookingsAtTime = tourBookings.filter(b => 
        b.booking_date === dateStr && 
        b.booking_time?.substring(0, 5) === timeStr &&
        (b.status === "confirmed" || b.status === "pending")
      )
      const guestsBooked = bookingsAtTime.reduce((sum, b) => sum + b.guest_count, 0)
      const maxLimit = tour.max_guests || slot.guest_limit || 1
      const isAvailable = (guestsBooked + guests) <= maxLimit
      
      return {
        time: timeStr,
        isAvailable,
        guestsBooked,
        maxLimit,
        endTime: endTimeStr
      }
    })
  }

  const selectedDayStatus = selectedDate ? getDayStatus(selectedDate) : "available"

  return (
    <div className="min-h-screen bg-background">
      {tour && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Product",
            "name": tour.title,
            "description": tour.description,
            "image": tour.images?.[0] || "https://ausaguide.com/og-image.png",
            "offers": {
              "@type": "Offer",
              "priceCurrency": "KES",
              "price": tour.price,
              "availability": "https://schema.org/InStock"
            }
          }}
        />
      )}
      {/* LaserFlow atmospheric background — sits behind the hero gradient */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <LaserFlow
          colors={["#7F5AF0", "#2CB67D", "#9B72F7", "#3DD9A4"]}
          opacity={0.5}
          className="h-full w-full"
        />
      </div>

      <div
        className="relative z-10 h-72 md:h-96 overflow-hidden bg-muted"
      >
        <img
          src={getTourImage(tour)}
          alt={tour.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div className="absolute left-0 right-0 top-0 mx-auto max-w-6xl px-6 pt-6">
          <Link
            to="/tours"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 text-sm text-foreground backdrop-blur-sm transition-colors hover:bg-background/80"
          >
            <ArrowLeft className="size-3.5" />
            Back to Tours
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-6xl px-6 pb-7">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-3 py-0.5 text-xs font-semibold",
                isVirtual
                  ? "border-primary/40 bg-primary/20 text-primary"
                  : "border-teal-500/40 bg-teal-500/20 text-teal-400"
              )}
            >
              {isVirtual ? (
                <span className="flex items-center gap-1">
                  <Wifi className="size-3" />
                  {typeLabel}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Globe className="size-3" />
                  {typeLabel}
                </span>
              )}
            </span>
            <span className="flex items-center gap-1 text-sm text-foreground/80">
              <Star className="size-3.5 fill-primary text-primary" />
              <span className="font-semibold">{tour.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({tour.review_count} reviews)</span>
            </span>
          </div>
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            {tour.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {tour.location_name}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {tour.duration_hours} hours
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              Up to {tour.max_guests} guests
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            <section>
              <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight text-foreground">
                About this experience
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">{tour.description}</p>
            </section>

            <Separator />

            {tour.highlights.length > 0 && (
              <>
                <section>
                  <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight text-foreground">
                    What's included
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {tour.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
                <Separator />
              </>
            )}

            <section>
              <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight text-foreground">
                Your host
              </h2>
              <div className="mt-5 flex items-start gap-4">
                <Avatar className="size-16 shrink-0">
                  <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
                    {hostInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/host/${tour.host_id}`} className="text-lg font-semibold text-foreground hover:text-primary hover:underline transition-colors">
                      {hostName}
                    </Link>
                    {tour.host?.is_verified && (
                      <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        <BadgeCheck className="size-3" />
                        Verified Host
                      </span>
                    )}
                    {isHostBusy && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <div className="relative flex size-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                      <span className="relative inline-flex size-2.5 rounded-full bg-destructive"></span>
                    </div>
                    <strong>Status:</strong> {hostBusyReason}
                  </div>
                )}
                </div>
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="size-3.5 fill-primary text-primary" />
                    <span className="font-medium text-foreground">{tour.rating.toFixed(1)}</span>
                    <span>· {tour.review_count} reviews</span>
                  </div>
                  {tour.host?.bio && (
                    <p className="mt-3 leading-7 text-sm text-muted-foreground">
                      {tour.host.bio}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight text-foreground">
                Policies
              </h2>
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <Shield className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Free cancellation</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Cancel up to 24 hours before the experience starts for a full refund. No
                    questions asked.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start">
            {/* Auth guard overlay — covers only the booking card, never blocks scroll */}
            <div className="relative">
            {!isAuthenticated && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 rounded-2xl"
                style={{
                  background: "rgba(22, 22, 26, 0.72)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(127, 90, 240, 0.25)",
                  boxShadow: "0 0 40px rgba(127, 90, 240, 0.12) inset",
                }}
              >
                {/* Glow ring */}
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30 shadow-[0_0_24px_rgba(127,90,240,0.35)]">
                  <Lock className="size-7 text-primary" aria-hidden="true" />
                </div>

                <div className="space-y-1 px-6 text-center">
                  <p className="text-base font-bold text-foreground leading-snug">
                    Sign in to book this tour
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Sign up or log in to select dates,
                    pick time slots, and confirm your booking.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 w-full px-6">
                  <Button
                    className="w-full rounded-full py-5 text-sm font-semibold shadow-lg shadow-primary/20"
                    onClick={() =>
                      navigate(
                        "/auth?redirect=" +
                          encodeURIComponent(`/tours/${tour.id}`) +
                          "&message=book"
                      )
                    }
                  >
                    Log In to Book
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-full py-5 text-sm border-border/60 text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      navigate("/onboarding")
                    }
                  >
                    Sign Up
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground/60 pb-1">
                  Free cancellation · No charge until confirmed
                </p>
              </div>
            )}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-3)]">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-foreground">
                  {formatTourPrice(tour.price, tour.currency)}
                </span>
                <span className="text-sm text-muted-foreground">/ person</span>
              </div>

              <div className="mt-1 flex items-center gap-1 text-sm">
                <Star className="size-3.5 fill-primary text-primary" />
                <span className="font-medium text-foreground">{tour.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({tour.review_count})</span>
              </div>

              <Separator className="my-5" />

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <CalendarDays className="size-4 text-primary" />
                  Select a date
                </p>
                <div className="flex justify-center overflow-hidden rounded-xl border border-border">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      date < addDays(new Date(), 0) || getDayStatus(date) === "unavailable"
                    }
                    modifiers={{
                      booked: (date) => getDayStatus(date) === "fully_booked"
                    }}
                    modifiersStyles={{
                      booked: { textDecoration: "line-through", opacity: 0.5 }
                    }}
                    className="[--cell-size:--spacing(9)]"
                  />
                </div>
                {selectedDate && (
                  <p className="mt-2 text-center text-xs text-muted-foreground font-semibold">
                    {selectedDate.toLocaleDateString("en-KE", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
                {selectedDate && (
                  <div className="mt-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
                      Select a time slot
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {getTimeSlots().map((slot, index) => {
                        const isSelected = selectedTime === slot.time
                        return (
                          <button
                            key={index}
                            type="button"
                            disabled={!slot.isAvailable}
                            onClick={() => setSelectedTime(slot.time)}
                            className={cn(
                              "flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition-all",
                              !slot.isAvailable
                                ? "border-border/40 bg-muted/20 text-muted-foreground cursor-not-allowed line-through"
                                : isSelected
                                ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                                : "border-border hover:border-foreground/40 bg-background text-foreground"
                            )}
                          >
                            <span className="text-sm font-semibold">{slot.time}</span>
                            <span className="text-[10px] opacity-80">until {slot.endTime}</span>
                            {slot.isAvailable ? (
                              <span className="text-[9px] text-teal font-medium mt-1">
                                {slot.maxLimit - slot.guestsBooked} spots remaining
                              </span>
                            ) : (
                              <span className="text-[9px] text-destructive font-semibold mt-1">
                                Fully Booked
                              </span>
                            )}
                          </button>
                        )
                      })}
                      {getTimeSlots().length === 0 && (
                        <p className="col-span-2 text-center text-xs text-muted-foreground italic py-2">
                          No available time slots on this day.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-5" />

              <div>
                <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Users className="size-4 text-primary" />
                  Guests
                </p>
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    disabled={guests <= 1}
                    aria-label="Decrease guests"
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="text-base font-semibold tabular-nums text-foreground">
                    {guests} {guests === 1 ? "guest" : "guests"}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={() => setGuests((g) => Math.min(tour.max_guests, g + 1))}
                    disabled={guests >= tour.max_guests}
                    aria-label="Increase guests"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <p className="mt-1.5 text-center text-xs text-muted-foreground">
                  Maximum {tour.max_guests} guests per booking
                </p>
              </div>

              {total !== null && (
                <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-primary/10 px-4 py-3">
                  <span className="text-sm font-medium text-muted-foreground">Total</span>
                  <span className="text-lg font-bold text-foreground">
                    {formatTourPrice(total, tour.currency)}
                  </span>
                </div>
              )}

              {selectedDayStatus === "fully_booked" ? (
                <div className="mt-5 space-y-3">
                  <div className="rounded-lg bg-amber-500/10 p-3 text-center text-sm text-amber-500 border border-amber-500/20">
                    Fully booked for this slot
                  </div>
                  <Button
                    className="w-full rounded-full py-6 text-base font-semibold border-border/80"
                    variant="outline"
                    onClick={handleJoinWaitlist}
                  >
                    Join Waiting List
                  </Button>
                  <p className="text-center text-xs text-muted-foreground leading-relaxed">
                    We'll notify you if a spot opens up.<br/>
                    You can choose to auto-book when available.
                  </p>
                </div>
              ) : (
                <>
                  <GlareHover
                    className="mt-5 w-full"
                    style={{ display: "block", borderRadius: "9999px" }}
                  >
                    <StarBorder
                      as="div"
                      color="#7F5AF0"
                      speed="4s"
                      thickness={2}
                      className="w-full rounded-full block"
                    >
                      <Button
                        className="w-full rounded-full py-6 text-base font-semibold"
                        disabled={!selectedDate || !selectedTime}
                        onClick={handleBookNow}
                      >
                        {!selectedDate 
                          ? "Select a date to book" 
                          : !selectedTime 
                          ? "Select a time slot" 
                          : "Book Now"}
                      </Button>
                    </StarBorder>
                  </GlareHover>

                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Free cancellation · No charge until confirmed
                  </p>
                </>
              )}
            </div>
            </div>{/* end relative wrapper for auth guard */}
          </div>
        </div>
        <ReviewList tourId={tour.id} bookingId={userBooking?.id} bookingStatus={userBooking?.status} />
      </div>
    </div>
  )
}
