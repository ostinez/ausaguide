import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom"
import { format } from "date-fns"
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  CalendarDays,
  User,
  Mail,
  Phone,
  Star,
  BadgeCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { fetchTourById } from "@/lib/api/tours"
import { createBooking } from "@/lib/api/bookings"
import type { Tour } from "@/lib/types"
import { formatTourPrice, getHostInitials, getTourGradient } from "@/lib/tour-utils"
import { cn } from "@/lib/utils"
import { MPesaCheckout } from "@/components/Checkout/MPesaCheckout"
import { CheckoutStepper } from "@/components/Checkout/CheckoutStepper"
import { supabase } from "@/lib/supabase"
import {
  validateName,
  validateEmail,
  validatePhone,
  validateBookingDate,
  sanitizeText,
} from "@/lib/validation"

const STEPS = [
  { label: "Experience" },
  { label: "Your Details" },
  { label: "Confirm & Pay" },
]

export default function CheckoutPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const dateParam = searchParams.get("date")
  const timeParam = searchParams.get("time")
  const guestsParam = Number(searchParams.get("guests") ?? "1")
  const typeParam = (searchParams.get("type") as "physical" | "virtual") || "physical"

  const [tour, setTour] = useState<Tour | null>(null)
  const [loadingTour, setLoadingTour] = useState(true)
  const [tourError, setTourError] = useState<string | null>(null)

  const [step, setStep] = useState(1)

  // Step 2 form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({})

  // Step 3 state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null)

  // Load tour
  useEffect(() => {
    if (!tourId) return
    fetchTourById(tourId)
      .then(setTour)
      .catch((e: Error) => setTourError(e.message))
      .finally(() => setLoadingTour(false))
  }, [tourId])

  // Pre-fill from auth session
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", data.user.id)
        .maybeSingle()
      if (profile) {
        if (profile.full_name) setName(profile.full_name)
        if (profile.email || data.user.email) setEmail(profile.email ?? data.user.email ?? "")
        if (profile.phone) setPhone(profile.phone)
      } else {
        if (data.user.email) setEmail(data.user.email)
      }
    })
  }, [])

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
        <Link to={`/tours/${tour.id}`}><Button variant="outline">Choose a date</Button></Link>
      </div>
    )
  }

  if (!timeParam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-xl font-semibold text-foreground">No time slot selected</p>
        <Link to={`/tours/${tour.id}`}><Button variant="outline">Choose a time slot</Button></Link>
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

  function validateStep2() {
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

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleNextFromStep1() {
    setStep(2)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleNextFromStep2(e: React.FormEvent) {
    e.preventDefault()
    if (!validateStep2()) return
    setStep(3)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleCreateBooking() {
    const dateErr = validateBookingDate(dateParam!)
    if (dateErr) { setSubmitError(dateErr); return }

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
        guest_id: (await supabase.auth.getUser()).data.user?.id || localStorage.getItem("user_id") || undefined,
        booking_type: typeParam,
        currency: tour!.currency || "KES",
      })
      setCreatedBookingId(booking.id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Order Summary (reused in steps 1 and 3) ───────────────────────────────

  const OrderSummary = () => (
    <aside className="rounded-2xl border border-border bg-card p-6 space-y-5 sticky top-6">
      {/* Host */}
      <div className="flex items-center gap-3">
        <Avatar className="size-12 border-2 border-primary/30">
          <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
            {hostInitials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-foreground">{hostName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {tour.host?.host_tier === "certified_guide" && (
              <span className="flex items-center gap-1 text-[10px] text-primary font-semibold">
                <BadgeCheck className="size-3" /> Certified Guide
              </span>
            )}
            {tour.rating && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-1">
                <Star className="size-3 fill-amber-400 text-amber-400" /> {tour.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Tour details */}
      <div className="space-y-3 text-sm">
        <p className="font-semibold text-base text-foreground leading-snug">{tour.title}</p>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="size-4 text-primary shrink-0" />
          <span>{format(bookingDate, "EEE, MMM d, yyyy")}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4 text-primary shrink-0" />
          <span>{timeParam}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="size-4 text-primary shrink-0" />
          <span>{guests} guest{guests !== 1 ? "s" : ""}</span>
        </div>
        {tour.location_name && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 text-primary shrink-0" />
            <span>{tour.location_name}</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Pricing */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>{formatTourPrice(price, tour.currency)} × {guests} guest{guests !== 1 ? "s" : ""}</span>
          <span>{formatTourPrice(total, tour.currency)}</span>
        </div>
        <div className="flex justify-between font-bold text-base text-foreground">
          <span>Total</span>
          <span className="text-primary">{formatTourPrice(total, tour.currency)}</span>
        </div>
      </div>

      {/* Trust badge */}
      <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2.5 text-xs text-primary font-medium">
        <CheckCircle2 className="size-4 shrink-0" />
        IntaSend-secured · M-PESA protected
      </div>
    </aside>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-32" style={{ background: getTourGradient(tour.category) }}>
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
          {step === 1 && "Review your experience details below."}
          {step === 2 && "Tell us a bit about yourself."}
          {step === 3 && "Confirm your details and pay securely with M-PESA."}
        </p>

        <div className="mt-6">
          <CheckoutStepper steps={STEPS} current={step} />
        </div>

        <div className="mt-2 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* ── Left column ── */}
          <div>

            {/* ─── STEP 1: Experience Summary ─── */}
            {step === 1 && (
              <section className="rounded-2xl border border-border bg-card p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <CalendarDays className="size-4 text-primary" />
                  Experience Details
                </h2>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-xl bg-muted/40 p-4 space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Date</span>
                    <p className="font-semibold text-foreground">{format(bookingDate, "EEE, MMM d, yyyy")}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-4 space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Time</span>
                    <p className="font-semibold text-foreground">{timeParam}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-4 space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Guests</span>
                    <p className="font-semibold text-foreground">{guests} guest{guests !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-4 space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Type</span>
                    <p className="font-semibold text-foreground capitalize">{typeParam}</p>
                  </div>
                </div>

                {tour.location_name && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4 text-primary mt-0.5 shrink-0" />
                    <span>{tour.location_name}</span>
                  </div>
                )}

                {tour.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{tour.description}</p>
                )}

                <Button
                  id="step1-next"
                  onClick={handleNextFromStep1}
                  className="w-full h-12 text-base font-bold gap-2"
                >
                  Continue to Your Details
                  <ArrowRight className="size-4" />
                </Button>
              </section>
            )}

            {/* ─── STEP 2: Traveller Details ─── */}
            {step === 2 && (
              <form
                id="checkout-form"
                onSubmit={handleNextFromStep2}
                className="rounded-2xl border border-border bg-card p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <User className="size-4 text-primary" />
                  Traveller Information
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
                    <Label htmlFor="guest-phone">M-PESA phone number *</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="guest-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })) }}
                        placeholder="07XX XXX XXX"
                        className={cn("pl-9", errors.phone && "border-destructive focus-visible:ring-destructive")}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    <p className="text-xs text-muted-foreground">The STK Push will be sent to this number</p>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label htmlFor="guest-notes">Special requests <span className="text-muted-foreground">(optional)</span></Label>
                    <textarea
                      id="guest-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special requests or accessibility needs…"
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12"
                  >
                    <ArrowLeft className="size-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    id="step2-next"
                    type="submit"
                    className="flex-1 h-12 font-bold gap-2"
                  >
                    Review & Pay
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* ─── STEP 3: Confirm & Pay ─── */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Confirm details summary */}
                <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <CheckCircle2 className="size-4 text-primary" />
                    Confirm Your Details
                  </h2>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium text-foreground">{name}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium text-foreground">{email}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground">M-PESA Phone</span>
                      <span className="font-medium text-foreground">{phone}</span>
                    </div>
                    {notes && (
                      <div className="flex justify-between py-1.5">
                        <span className="text-muted-foreground">Notes</span>
                        <span className="font-medium text-foreground text-right max-w-[200px]">{notes}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs text-primary underline-offset-2 hover:underline"
                  >
                    Edit details
                  </button>
                </section>

                {/* Error display */}
                {submitError && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {submitError}
                  </div>
                )}

                {/* M-PESA payment widget */}
                {!createdBookingId ? (
                  <section className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-foreground mb-4">
                      <Phone className="size-4 text-primary" />
                      Pay with M-PESA
                    </h2>
                    <p className="text-sm text-muted-foreground mb-5">
                      Click below to create your booking and receive an M-PESA STK Push prompt on <strong className="text-foreground">{phone}</strong>.
                    </p>
                    <Button
                      id="pay-now-btn"
                      onClick={handleCreateBooking}
                      disabled={submitting}
                      className="w-full h-14 text-base font-bold gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20"
                    >
                      {submitting ? (
                        <><Spinner className="size-5" /> Creating booking…</>
                      ) : (
                        <>Pay {formatTourPrice(total, tour.currency)} with M-PESA</>
                      )}
                    </Button>
                  </section>
                ) : (
                  <MPesaCheckout
                    bookingId={createdBookingId}
                    amount={total}
                    currency={tour.currency || "KES"}
                    email={email}
                    prefillPhone={phone}
                    onSuccess={() => {
                      navigate(`/messages?hostId=${tour.host_id}&bookingId=${createdBookingId}`)
                    }}
                    onError={(msg) => setSubmitError(msg)}
                  />
                )}
              </div>
            )}
          </div>

          {/* ── Right column: Order Summary (always visible) ── */}
          <OrderSummary />
        </div>
      </div>
    </div>
  )
}
