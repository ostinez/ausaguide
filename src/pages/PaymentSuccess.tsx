import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { CheckCircle2, Calendar, Users, ArrowRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { fetchBookingById } from "@/lib/api/bookings"
import type { Booking } from "@/lib/types"

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get("booking_id") || searchParams.get("api_ref")
  const paymentId = searchParams.get("payment_id") || searchParams.get("tracking_id")

  const [loading, setLoading] = useState(true)
  const [, setVerified] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function verifyAndFetch() {
      if (!bookingId && !paymentId) {
        setError("Missing booking or payment parameters")
        setLoading(false)
        return
      }

      try {
        // Call inta-pay-verify edge function
        const { data: verifyData } = await supabase.functions.invoke("inta-pay-verify", {
          body: { booking_id: bookingId, payment_id: paymentId },
        })

        if (verifyData?.verified || verifyData?.payment_status === "paid") {
          setVerified(true)
        }

        // Fetch latest booking record
        if (bookingId) {
          const b = await fetchBookingById(bookingId)
          setBooking(b)
        }
      } catch (err: any) {
        console.error("Verification error:", err)
        setError(err.message || "Could not verify payment")
      } finally {
        setLoading(false)
      }
    }

    verifyAndFetch()
  }, [bookingId, paymentId])

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 bg-background p-6">
        <Spinner className="size-10 text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Verifying IntaSend payment status...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-lg">
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-500/10 text-green-500">
              <CheckCircle2 className="size-10" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Payment Successful!
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Your booking has been verified and confirmed with IntaSend.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {booking ? (
              <div className="space-y-4 rounded-xl border border-border bg-background/50 p-4 text-sm">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-muted-foreground">Booking ID</span>
                  <span className="font-mono text-xs text-foreground">{booking.id.slice(0, 8)}...</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-4 text-primary" /> Date
                  </span>
                  <span className="font-semibold text-foreground">{booking.booking_date}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Users className="size-4 text-primary" /> Guests
                  </span>
                  <span className="font-semibold text-foreground">{booking.guest_count}</span>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3 font-semibold">
                  <span>Total Amount Paid</span>
                  <span className="text-base text-primary">
                    {booking.currency || "KES"} {(booking.payment_amount || booking.total_price)?.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-green-500 pt-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="size-3.5" /> Payment Status
                  </span>
                  <span className="font-bold uppercase tracking-wider bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                    Paid
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-background/50 p-4 text-center text-sm text-muted-foreground">
                Thank you! Payment verification completed successfully.
              </div>
            )}

            {error && (
              <p className="text-center text-xs text-amber-500">
                Note: {error}
              </p>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <Link to="/dashboard">
                <Button className="w-full gap-2">
                  Go to My Dashboard
                  <ArrowRight className="size-4" />
                </Button>
              </Link>

              <Link to="/tours">
                <Button variant="outline" className="w-full">
                  Explore More Tours
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
