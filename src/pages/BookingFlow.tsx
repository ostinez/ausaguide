import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom"
import { ArrowLeft, CheckCircle2, User, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { fetchTourById } from "@/lib/api/tours"
import { createBooking } from "@/lib/api/bookings"
import type { Tour } from "@/lib/types"
import { PaystackCheckout } from "@/components/Checkout/PaystackCheckout"
import { validateName, validateEmail, validatePhone, sanitizeText } from "@/lib/validation"

export default function BookingFlow() {
  const { tourId } = useParams<{ tourId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const dateParam = searchParams.get("date")
  const timeParam = searchParams.get("time")
  const guestsParam = Number(searchParams.get("guests") ?? "1")
  const typeParam = (searchParams.get("type") as "physical" | "virtual") || "physical"

  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null)
  const [bookingTotal, setBookingTotal] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tourId) return
    fetchTourById(tourId)
      .then(setTour)
      .finally(() => setLoading(false))
  }, [tourId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (!tour || !dateParam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-xl font-semibold">Invalid booking details</p>
        <Link to="/tours"><Button variant="outline">Back to Tours</Button></Link>
      </div>
    )
  }

  const price = typeParam === "virtual" ? (tour.virtual_price ?? 0) : (tour.physical_price ?? tour.price)
  const total = price * Math.max(1, guestsParam)

  async function handleProceedToPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email) {
      setError("Please fill in required fields")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const booking = await createBooking({
        tour_id: tour!.id,
        host_id: tour!.host_id,
        booking_date: dateParam!,
        booking_time: timeParam || undefined,
        guest_count: guestsParam,
        total_price: total,
        guest_name: sanitizeText(name),
        guest_email: email.trim().toLowerCase(),
        guest_phone: phone.trim(),
        guest_id: localStorage.getItem("user_id") || undefined,
        booking_type: typeParam,
        currency: tour!.currency,
      })

      setCreatedBookingId(booking.id)
      setBookingTotal(total)
    } catch (err: any) {
      setError(err?.message || "Failed to create booking")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to={`/tours/${tour.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to tour
        </Link>

        <h1 className="text-2xl font-bold text-foreground">Booking Flow: {tour.title}</h1>

        {!createdBookingId ? (
          <form onSubmit={handleProceedToPayment} className="space-y-4 rounded-xl border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <User className="size-4 text-primary" /> Guest Information
            </h2>

            {error && <div className="rounded bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="guest-name">Full Name</Label>
              <Input id="guest-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-email">Email Address</Label>
              <Input id="guest-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-phone">Phone Number</Label>
              <Input id="guest-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <Button type="submit" disabled={submitting} className="w-full gap-2 mt-4">
              {submitting ? <Spinner className="size-4" /> : <CreditCard className="size-4" />}
              Proceed to Paystack Payment ({tour.currency} {total})
            </Button>
          </form>
        ) : (
          <PaystackCheckout
            amount={bookingTotal}
            currency={tour.currency}
            email={email}
            bookingId={createdBookingId}
            guestName={name}
            tourTitle={tour.title}
            onSuccess={() => navigate(`/confirmation/${createdBookingId}`)}
            onCancel={() => setCreatedBookingId(null)}
          />
        )}
      </div>
    </div>
  )
}
