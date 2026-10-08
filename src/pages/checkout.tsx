import { useState, useEffect } from "react"
import { useParams, useSearchParams, Link } from "react-router-dom"
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
  ShieldCheck,
  Lock,
  CreditCard,
  Smartphone,
  Wrench,
} from "lucide-react"
import { arePaymentsEnabled } from "@/lib/payments-config"
import IntaSendTrustBadge from "@/components/IntaSendTrustBadge"
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

  const dateParam = searchParams.get("date")
  const timeParam = searchParams.get("time")
  const guestsParam = Number(searchParams.get("guests") ?? "1")
  const typeParam = (searchParams.get("type") as "physical" | "virtual") || "physical"

  const paymentsEnabled = arePaymentsEnabled()

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
  const [paying, setPaying] = useState(false)
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null)
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

  // ── IntaSend Payment Flow ────────────────────────────────────────────────

  async function handlePayNow() {
    if (!paymentsEnabled) {
      setSubmitError("Checkout is temporarily unavailable while we upgrade our payment system. Join the waitlist and we'll notify you the moment we're back.")
      return
    }

    const dateErr = validateBookingDate(dateParam!)
    if (dateErr) {
      setSubmitError(dateErr)
      return
    }

    setPaying(true)
    setSubmitError(null)
    setPaymentStatusMessage("Securing your booking details...")

    try {
      let bookingId = createdBookingId

      // 1. Create booking in Supabase if not created yet
      if (!bookingId) {
        const userAuth = await supabase.auth.getUser()
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
          guest_id: userAuth.data.user?.id || localStorage.getItem("user_id") || undefined,
          booking_type: typeParam,
          currency: tour!.currency || "KES",
        })
        bookingId = booking.id
        setCreatedBookingId(booking.id)
      }

      const cleanDigits = phone.trim().replace(/\D/g, "")
      let normalizedPhone = cleanDigits
      if (cleanDigits.startsWith("254") && cleanDigits.length === 12) {
        normalizedPhone = cleanDigits
      } else if (cleanDigits.startsWith("0") && cleanDigits.length === 10) {
        normalizedPhone = "254" + cleanDigits.slice(1)
      } else if (cleanDigits.length === 9) {
        normalizedPhone = "254" + cleanDigits
      }

      const firstName = sanitizeText(name).split(" ")[0] || sanitizeText(name)
      const lastName = sanitizeText(name).split(" ").slice(1).join(" ") || ""

      setPaymentStatusMessage("Redirecting to secure checkout...")

      let paymentUrl: string | null = null
      let detailedError: string | null = null

      // Build the payload once — log it so we can verify all values in the browser console
      const intaPayload = {
        amount: Number(total),
        currency: tour!.currency || "KES",
        email: email.trim().toLowerCase(),
        phone: normalizedPhone,
        first_name: firstName,
        last_name: lastName,
        api_ref: bookingId,
        booking_id: bookingId,
        bookingId: bookingId,
        booking_type: typeParam,
      }

      console.log("[Checkout] Payment payload (pre-send):", {
        ...intaPayload,
        phone: normalizedPhone ? `${normalizedPhone.slice(0, 5)}****` : "(empty!)",
        email: email ? `${email.slice(0, 4)}****` : "(empty!)",
      })

      // 2a. Call IntaSend via Supabase Edge Function (explicit fetch to avoid invoke body-serialization bug)
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ""
        const { data: { session } } = await supabase.auth.getSession()
        const authToken = session?.access_token || supabaseAnonKey

        const fnRes = await fetch(`${supabaseUrl}/functions/v1/inta-pay-init`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
            "apikey": supabaseAnonKey,
          },
          body: JSON.stringify(intaPayload),
        })

        const fnData = await fnRes.json().catch(() => null)
        console.log("[Checkout] Edge Function response:", fnRes.status, fnData)

        if (fnRes.ok && (fnData?.checkout_url || fnData?.url)) {
          paymentUrl = fnData.checkout_url || fnData.url
        } else {
          detailedError =
            fnData?.error ||
            fnData?.message ||
            `Edge Function returned HTTP ${fnRes.status}`
        }
      } catch (e: any) {
        console.error("[Checkout] Edge Function call failed:", e)
        detailedError = e?.message || "Edge Function unreachable"
      }

      // 2b. Fallback: If Edge Function failed, try Vercel serverless /api/create-checkout
      if (!paymentUrl) {
        console.warn("[Checkout] Edge Function failed, trying Vercel fallback. Reason:", detailedError)
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const res = await fetch("/api/create-checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify(intaPayload),
          })
          const vercelData = await res.json().catch(() => null)
          console.log("[Checkout] Vercel fallback response:", res.status, vercelData)
          if (res.ok && (vercelData?.checkout_url || vercelData?.url)) {
            paymentUrl = vercelData.checkout_url || vercelData.url
          } else if (vercelData?.error) {
            detailedError = vercelData.error
          }
        } catch (_) {}
      }

      if (!paymentUrl) {
        throw new Error(detailedError || "Payment checkout URL was not returned by the payment gateway.")
      }

      // 3. Redirect to IntaSend checkout page
      window.location.href = paymentUrl
    } catch (err: unknown) {
      console.error("[Checkout] Payment initiation failed:", err)
      const message = err instanceof Error ? err.message : "Payment initialization failed. Please try again."
      setSubmitError(message)
      setPaying(false)
      setPaymentStatusMessage(null)
    }
  }

  // ── Order Summary ────────────────────────────────────────────────────────

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

      {/* Trust & Security Badge or Maintenance Badge */}
      {paymentsEnabled ? (
        <IntaSendTrustBadge variant="compact" />
      ) : (
        <div className="rounded-xl border border-[#F97316]/20 bg-[#F97316]/5 p-3.5 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#F97316]">
            <Wrench className="size-4 text-[#F97316]" />
            <span>Payment System Maintenance</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Payments temporarily paused · Join waitlist for launch updates
          </p>
        </div>
      )}
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
            className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-background/80"
          >
            <ArrowLeft className="size-3.5" />
            Back to tour
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-24 pt-4">
        <h1 className="scroll-m-20 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Complete your booking
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === 1 && "Review your experience details below."}
          {step === 2 && "Tell us a bit about yourself."}
          {step === 3 && "Confirm your details and proceed to secure payment."}
        </p>

        <div className="mt-6">
          <CheckoutStepper steps={STEPS} current={step} />
        </div>

        {/* Top notice banner on checkout page when payments are disabled */}
        {!paymentsEnabled && (
          <div className="mt-6 rounded-2xl border border-[#F97316]/30 bg-[#F97316]/10 p-4 sm:p-5 flex items-start gap-3.5 text-foreground shadow-sm">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30">
              <Wrench className="size-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Payment Integration Update</h3>
                <span className="rounded-full bg-[#F97316]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F97316]">Maintenance</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Checkout is temporarily unavailable while we upgrade our payment system. Join the waitlist and we'll notify you the moment we're back.
              </p>
              <div className="pt-1.5">
                <Link
                  to="/waitlist"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#F97316] hover:underline"
                >
                  Join the Waitlist &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
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
                    <Label htmlFor="guest-phone">Phone number *</Label>
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
                      <span className="text-muted-foreground">Phone</span>
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

                {/* Payments Maintenance Notice / Payment Form */}
                {!paymentsEnabled ? (
                  <section className="rounded-2xl border border-[#F97316]/30 bg-card p-6 sm:p-8 space-y-5 shadow-sm text-center">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#F97316]/15 border border-[#F97316]/30 text-[#F97316]">
                      <Wrench className="size-7" />
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                      <h3 className="text-base sm:text-lg font-bold text-foreground">
                        Payment System Under Maintenance
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Checkout is temporarily unavailable while we upgrade our payment system. Join the waitlist and we'll notify you the moment we're back.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button
                        asChild
                        className="w-full sm:w-auto h-12 px-6 font-semibold bg-[#F97316] hover:bg-[#EA580C] text-white shadow-md gap-2"
                      >
                        <Link to="/waitlist">
                          Join the Waitlist &rarr;
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(2)}
                        className="w-full sm:w-auto h-12"
                      >
                        Back to details
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground/80 pt-1">
                      No charge has been made to your account. We will notify you by email as soon as checkout is back online.
                    </p>
                  </section>
                ) : (
                  /* Clean Payment Section */
                  <section className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border/60 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <ShieldCheck className="size-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Safe & Secure Checkout</h3>
                          <p className="text-xs text-muted-foreground">Powered by IntaSend · M-PESA & Cards</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Smartphone className="size-4 text-primary" />
                        <CreditCard className="size-4 text-primary" />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Click <strong>Pay Now</strong> to proceed to our secure checkout page to complete your payment via M-PESA STK Push or Card.
                    </p>

                    <Button
                      id="pay-now-btn"
                      onClick={handlePayNow}
                      disabled={paying}
                      className="w-full h-14 text-base font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all"
                    >
                      {paying ? (
                        <>
                          <Spinner className="size-5" />
                          {paymentStatusMessage || "Redirecting to Payment..."}
                        </>
                      ) : (
                        <>
                          <Lock className="size-4" />
                          Pay Now ({formatTourPrice(total, tour.currency)})
                          <ArrowRight className="size-4 ml-auto" />
                        </>
                      )}
                    </Button>

                    <IntaSendTrustBadge variant="compact" className="pt-2" />
                  </section>
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
