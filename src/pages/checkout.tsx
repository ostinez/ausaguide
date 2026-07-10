import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom"
import { format } from "date-fns"
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  CalendarDays,
  CreditCard,
  User,
  Mail,
  Phone,
  Star,
  BadgeCheck,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { fetchTourById } from "@/lib/api/tours"
import { createBooking } from "@/lib/api/bookings"
import { supabase } from "@/lib/supabase"
import type { Tour } from "@/lib/types"
import { formatTourPrice, getHostInitials, getTourGradient } from "@/lib/tour-utils"
import { cn } from "@/lib/utils"
import {
  validateName,
  validateEmail,
  validatePhone,
  validateBookingDate,
  sanitizeText,
} from "@/lib/validation"

export default function CheckoutPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Read date, time & guests from query params passed from tour-detail
  const dateParam = searchParams.get("date") // YYYY-MM-DD
  const timeParam = searchParams.get("time") // HH:MM
  const guestsParam = Number(searchParams.get("guests") ?? "1")
  const typeParam = (searchParams.get("type") as "physical" | "virtual") || "physical"

  const [tour, setTour] = useState<Tour | null>(null)
  const [loadingTour, setLoadingTour] = useState(true)
  const [tourError, setTourError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Field-level validation errors
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({})

  useEffect(() => {
    if (!tourId) return
    fetchTourById(tourId)
      .then(setTour)
      .catch((e: Error) => setTourError(e.message))
      .finally(() => setLoadingTour(false))
  }, [tourId])

  // ── Guards ────────────────────────────────────────────────────────────────

  if (loadingTour) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Spinner className="size-8 text-primary" />
        <p className="text-sm text-muted-foreground">Loading checkout…</p>
      </div>
    )
  }

  if (tourError || !tour) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-xl font-semibold text-foreground">Tour not found</p>
        <Link to="/tours"><Button variant="outline">Back to Tours</Button></Link>
      </div>
    )
  }

  if (!dateParam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-xl font-semibold text-foreground">No date selected</p>
        <Link to={`/tours/${tour.id}`}>
          <Button variant="outline">Choose a date</Button>
        </Link>
      </div>
    )
  }

  if (!timeParam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-xl font-semibold text-foreground">No time slot selected</p>
        <Link to={`/tours/${tour.id}`}>
          <Button variant="outline">Choose a time slot</Button>
        </Link>
      </div>
    )
  }

  const bookingDate = new Date(dateParam + "T00:00:00")
  const guests = Math.min(Math.max(1, guestsParam), tour.max_guests)
  const price = typeParam === "virtual" ? (tour.virtual_price ?? 0) : (tour.physical_price ?? tour.price)
  const total = price * guests
  const hostName = tour.host?.full_name ?? "Local Host"
  const hostInitials = getHostInitials(hostName)

  // ── Validation ────────────────────────────────────────────────────────────

  function validate() {
    const errs: typeof errors = {}

    const nameErr = validateName(name)
    if (nameErr) errs.name = nameErr

    const emailErr = validateEmail(email)
    if (emailErr) errs.email = emailErr

    const phoneErr = validatePhone(phone)
    if (phoneErr) errs.phone = phoneErr

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    // Guard: booking date must be today or in the future
    const dateErr = validateBookingDate(dateParam)
    if (dateErr) {
      setSubmitError(dateErr)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const booking = await createBooking({
        tour_id: tour!.id,
        host_id: tour!.host_id,
        booking_date: dateParam!,
        booking_time: timeParam || undefined,
        guest_count: guests,
        total_price: total,
        guest_name: sanitizeText(name),
        guest_email: email.trim().toLowerCase(),
        guest_phone: phone.trim(),
        notes: notes.trim() ? sanitizeText(notes) : undefined,
        guest_id: localStorage.getItem("user_id") || undefined,
        booking_type: typeParam,
      })

      // Call the create-booking-session Edge Function to get the Stripe Checkout redirect URL
      const { data, error: functionErr } = await supabase.functions.invoke("create-booking-session", {
        body: {
          bookingId: booking.id,
          tourType: typeParam,
        }
      })

      if (functionErr) {
        throw new Error(functionErr.message || "Failed to create Stripe payment session")
      }

      if (data?.sessionUrl) {
        // Redirect traveler to Stripe Checkout
        window.location.href = data.sessionUrl
      } else {
        // Fallback if Stripe redirect is unavailable
        navigate(`/confirmation/${booking.id}`)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setSubmitError(message)
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Coloured banner matching tour category */}
      <div
        className="relative h-32"
        style={{ background: getTourGradient(tour.category) }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
        <div className="absolute left-0 right-0 top-0 mx-auto max-w-4xl px-6 pt-6">
          <Link
            to={`/tours/${tour.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 text-sm text-foreground backdrop-blur-sm transition-colors hover:bg-background/80"
          >
            <ArrowLeft className="size-3.5" />
            Back to tour
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 pb-20 pt-4">
        <h1 className="scroll-m-20 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Complete your booking
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the details below and enter your information to confirm.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* ── Left: Traveller form ── */}
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
                <User className="size-4 text-primary" />
                Traveller information
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="guest-name">Full name *</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="guest-name"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })) }}
                      placeholder="Your full name"
                      className={cn("pl-9", errors.name && "border-destructive focus-visible:ring-destructive")}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="guest-email">Email address *</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="guest-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })) }}
                      placeholder="you@example.com"
                      className={cn("pl-9", errors.email && "border-destructive focus-visible:ring-destructive")}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="guest-phone">Phone number *</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="guest-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })) }}
                      placeholder="+254 700 000 000"
                      className={cn("pl-9", errors.phone && "border-destructive focus-visible:ring-destructive")}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="guest-notes">
                    Special requests
                    <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                  </Label>
                  <textarea
                    id="guest-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Dietary requirements, accessibility needs, questions for your host…"
                    rows={3}
                    className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                  />
                </div>
              </div>
            </section>

            {/* Error banner */}
            {submitError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            )}

            {/* Mobile: show submit button inside form section */}
            <div className="lg:hidden">
              <Button
                type="submit"
                form="checkout-form"
                size="lg"
                className="w-full rounded-full py-6 text-base font-semibold"
                disabled={submitting}
              >
                {submitting ? (
                  <><Spinner className="mr-2 size-4" />Processing…</>
                ) : (
                  <><CreditCard className="mr-2 size-4" />Confirm Booking</>
                )}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Free cancellation · No charge until confirmed
              </p>
            </div>
          </form>

          {/* ── Right: Booking summary ── */}
          <div className="lg:sticky lg:top-8 lg:self-start space-y-4">
            {/* Tour card */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Booking summary
              </h2>

              {/* Tour info */}
              <div className="flex items-start gap-3">
                <div
                  className="flex size-14 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: getTourGradient(tour.category) }}
                >
                  <MapPin className="size-6 text-white/50" />
                </div>
                <div>
                  <p className="font-semibold leading-tight text-foreground">{tour.title}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3 fill-primary text-primary" />
                    <span>{tour.rating.toFixed(1)}</span>
                    <span>· {tour.review_count} reviews</span>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Details grid */}
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="size-3.5 text-primary" />
                    Date
                  </dt>
                  <dd className="font-medium text-foreground">
                    {format(bookingDate, "EEE, d MMM yyyy")}
                  </dd>
                </div>

                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-3.5 text-primary" />
                    Time Slot
                  </dt>
                  <dd className="font-medium text-foreground">
                    {timeParam}
                  </dd>
                </div>

                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-3.5 text-primary" />
                    Duration
                  </dt>
                  <dd className="font-medium text-foreground">{tour.duration_hours} hours</dd>
                </div>

                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Users className="size-3.5 text-primary" />
                    Guests
                  </dt>
                  <dd className="font-medium text-foreground">
                    {guests} {guests === 1 ? "guest" : "guests"}
                  </dd>
                </div>

                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-3.5 text-primary" />
                    Location
                  </dt>
                  <dd className="font-medium text-foreground text-right">{tour.location_name}</dd>
                </div>
              </dl>

              <Separator className="my-4" />

              {/* Pricing */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{formatTourPrice(tour.price, tour.currency)} × {guests} {guests === 1 ? "guest" : "guests"}</span>
                  <span>{formatTourPrice(total, tour.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-foreground">
                  <span>Total</span>
                  <span className="text-primary">{formatTourPrice(total, tour.currency)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Host */}
              <div className="flex items-center gap-3">
                <Avatar className="size-10 shrink-0">
                  <AvatarFallback className="bg-primary/20 text-sm font-semibold text-primary">
                    {hostInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">Hosted by</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground">{hostName}</p>
                    {tour.host?.is_verified && (
                      <BadgeCheck className="size-3.5 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: confirm button lives in the sidebar */}
            <div className="hidden lg:block">
              <Button
                type="submit"
                form="checkout-form"
                size="lg"
                className="w-full rounded-full py-6 text-base font-semibold"
                disabled={submitting}
              >
                {submitting ? (
                  <><Spinner className="mr-2 size-4" />Processing…</>
                ) : (
                  <><CreditCard className="mr-2 size-4" />Confirm Booking</>
                )}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Free cancellation · No charge until confirmed
              </p>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 shrink-0 text-teal" />
              Booking confirmed instantly — host notified by email
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
