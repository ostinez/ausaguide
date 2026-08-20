import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { CheckCircle2, Calendar, Users, ArrowRight, ShieldCheck, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { fetchBookingById } from "@/lib/api/bookings"
import type { Booking } from "@/lib/types"

async function ensureReceiptMessage(booking: Booking, userId: string) {
 const hostId = booking.host_id
 const guestId = booking.guest_id || userId
 if (!hostId || !guestId) return

 // Find or create conversation
 let convId: string | null = null
 const [pA, pB] = [guestId, hostId].sort()
 const { data: existingConv } = await supabase
 .from("conversations")
 .select("id")
 .or(
 `and(participant_a.eq.${pA},participant_b.eq.${pB}),and(participant_a.eq.${pB},participant_b.eq.${pA})`
 )
 .maybeSingle()

 if (existingConv) {
 convId = existingConv.id
 } else {
 const { data: newConv } = await supabase
 .from("conversations")
 .insert({
 participant_a: pA,
 participant_b: pB,
 })
 .select("id")
 .single()
 convId = newConv?.id ?? null
 }

 if (!convId) return

 // Check if receipt already exists (webhook may have already inserted it)
 const { data: existing } = await supabase
 .from("messages")
 .select("id")
 .eq("conversation_id", convId)
 .eq("sender_type", "system")
 .like("message", `%${booking.id}%`)
 .maybeSingle()

 if (existing) return // receipt already created by webhook

 // Insert client-side receipt as fallback
 const tourName = (booking as any).tours?.title || "Your tour"
 await supabase.from("messages").insert({
 conversation_id: convId,
 sender_id: null,
 receiver_id: guestId,
 message: `Booking confirmed for ${tourName} on ${booking.booking_date}`,
 sender_type: "system",
 metadata: {
 type: "booking_receipt",
 booking_id: booking.id,
 tour_name: tourName,
 date: booking.booking_date,
 time: booking.booking_time,
 guests: booking.guest_count,
 total: booking.total_price,
 currency: (booking as any).payment_currency || "KES",
 payment_id: (booking as any).payment_id,
 confirmed_at: new Date().toISOString(),
 },
 read: false,
 })
}

export default function PaymentSuccessPage() {
 const [searchParams] = useSearchParams()
 const navigate = useNavigate()
 const bookingId = searchParams.get("booking_id") || searchParams.get("api_ref")
 const paymentId = searchParams.get("payment_id") || searchParams.get("tracking_id")

 const [loading, setLoading] = useState(true)
 const [booking, setBooking] = useState<Booking | null>(null)
 const [error, setError] = useState<string | null>(null)
 const [currentUserId, setCurrentUserId] = useState<string | null>(null)

 useEffect(() => {
 supabase.auth.getUser().then(({ data }) => {
 setCurrentUserId(data.user?.id ?? null)
 })
 }, [])

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

 console.log("Verify response:", verifyData)

 // Fetch latest booking record
 if (bookingId) {
 const b = await fetchBookingById(bookingId)
 setBooking(b)

 // Ensure receipt is in chat (client-side fallback)
 if (currentUserId && b) {
 await ensureReceiptMessage(b, currentUserId).catch(console.warn)
 }
 }
 } catch (err: any) {
 console.error("Verification error:", err)
 setError(err.message || "Could not verify payment")
 } finally {
 setLoading(false)
 }
 }

 verifyAndFetch()
 }, [bookingId, paymentId, currentUserId])

 if (loading) {
 return (
 <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 bg-background p-6">
 <Spinner className="size-10 text-primary" />
 <p className="text-sm font-medium text-muted-foreground">Verifying payment…</p>
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
 Your booking is confirmed. A receipt has been sent to your messages.
 </p>
 </CardHeader>

 <CardContent className="space-y-6 pt-4">
 {booking ? (
 <div className="space-y-3 rounded-xl border border-border bg-background/50 p-4 text-sm">
 <div className="flex items-center justify-between font-medium">
 <span className="text-muted-foreground">Booking ID</span>
 <span className="font-mono text-xs text-foreground">{booking.id.slice(0, 8)}…</span>
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
 </div>
 ) : error ? (
 <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400">
 {error}
 </div>
 ) : null}

 <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2.5 text-xs text-primary font-medium">
 <ShieldCheck className="size-4 shrink-0" />
 Secured by IntaSend · M-PESA protected
 </div>

 <div className="flex flex-col gap-3">
 {/* Primary CTA: go to messages */}
 <Button
 id="view-booking-btn"
 className="w-full h-12 font-bold gap-2"
 onClick={() => {
 if (booking?.host_id) {
 navigate(`/messages?hostId=${booking.host_id}&bookingId=${booking.id}`)
 } else {
 navigate("/messages")
 }
 }}
 >
 <MessageSquare className="size-4" />
 Message Your Host
 </Button>

 <Button
 id="browse-more-btn"
 variant="outline"
 className="w-full h-11 gap-2"
 onClick={() => navigate("/tours")}
 >
 Browse More Tours
 <ArrowRight className="size-4" />
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 )
}
