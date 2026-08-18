import { useState, useEffect } from "react"
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom"
import ReviewForm from '@/components/ui/ReviewForm';
import { createOrGetDailyRoom } from "@/lib/api/daily"
import { LiveLocationMap } from "@/components/map/LiveLocationMap"
import { format } from "date-fns"
import {
 CheckCircle2,
 CalendarDays,
 Clock,
 Users,
 MapPin,
 Copy,
 Video,
 LayoutDashboard,
 BadgeCheck,
 Star,
 ArrowRight,
 Wifi,
 MessageSquare,
 Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { fetchBookingById } from "@/lib/api/bookings"
import type { Booking } from "@/lib/types"
import { formatTourPrice, getHostInitials, getTourGradient } from "@/lib/tour-utils"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { DirectMessageButton } from "@/components/common/DirectMessageButton"

export default function ConfirmationPage() {
 const { bookingId } = useParams<{ bookingId: string }>()
 const navigate = useNavigate()
 const [searchParams] = useSearchParams()
 const [booking, setBooking] = useState<Booking | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [copied, setCopied] = useState(false)
 const [callUrl, setCallUrl] = useState<string | null>(null)
 const [callActive, setCallActive] = useState(false)
 const [startingCall, setStartingCall] = useState(false)
 const [callError, setCallError] = useState<string | null>(null)
 const [countdownText, setCountdownText] = useState("")
 const [canJoin, setCanJoin] = useState(false)

 // Tip jar states
 const [tipPercent, setTipPercent] = useState<number | "custom" | null>(null)
 const [customTip, setCustomTip] = useState("")
 const [tipping, setTipping] = useState(false)
 const [tipError, setTipError] = useState<string | null>(null)

 const subtotal = booking?.total_price || 0
 const tipAmount = tipPercent === "custom"
 ? (Number(customTip) || 0)
 : tipPercent !== null
 ? Math.round(subtotal * (tipPercent / 100))
 : 0

 useEffect(() => {
 const successParam = searchParams.get("success")
 const errorParam = searchParams.get("error")
 if (successParam === "tip" || errorParam === "tip_success") {
 toast.success("Thank you for tipping your host!")
 }
 }, [searchParams])

 async function handleSendTip() {
 if (!booking || tipAmount <= 0) return
 setTipping(true)
 setTipError(null)
 try {
 const { data, error: functionErr } = await supabase.functions.invoke("inta-pay-init", {
 body: {
 bookingId: booking.id,
 amount: tipAmount,
 currency: booking.currency || "KES",
 email: booking.guest_email || "guest@ausaguide.com",
 phone: booking.guest_phone || "",
 method: "CHECKOUT_URL",
 }
 })

 if (functionErr) {
 let errorMsg = "Failed to create IntaSend tip payment"
 if (functionErr instanceof Error) {
 errorMsg = functionErr.message
 }
 throw new Error(errorMsg)
 }

 if (data?.checkout_url || data?.sessionUrl) {
 window.location.href = data.checkout_url || data.sessionUrl
 } else {
 toast.success("Tip payment initiated! IntaSend reference: " + (data?.payment_id || booking.id))
 setTipping(false)
 }
 } catch (err: any) {
 console.error("Tipping error:", err)
 setTipError(err.message || "Failed to process tip payment")
 setTipping(false)
 }
 }

 useEffect(() => {
 if (!booking) return
 const startStr = booking.booking_time 
 ? `${booking.booking_date}T${booking.booking_time}` 
 : `${booking.booking_date}T09:00:00`
 const startTime = new Date(startStr).getTime()

 function update() {
 const now = Date.now()
 const diff = startTime - now
 const diffMinutes = Math.floor(diff / 60000)

 if (diffMinutes <= 5) {
 setCanJoin(true)
 if (diff <= 0) {
 setCountdownText("Started")
 } else {
 setCountdownText("Starting now")
 }
 } else {
 setCanJoin(false)
 const hours = Math.floor(diffMinutes / 60)
 const minutes = diffMinutes % 60
 if (hours > 0) {
 setCountdownText(`Starts in: ${hours}h ${minutes}m`)
 } else {
 setCountdownText(`Starts in: ${minutes}m`)
 }
 }
 }

 update()
 const timer = setInterval(update, 1000)
 return () => clearInterval(timer)
 }, [booking])

 useEffect(() => {
 if (!bookingId) return
 fetchBookingById(bookingId)
 .then((b) => {
 setBooking(b)
 if (b?.daily_room_url) {
 setCallUrl(b.daily_room_url)
 }
 })
 .catch((e: Error) => setError(e.message))
 .finally(() => setLoading(false))
 }, [bookingId])

 async function handleStartCall() {
 if (!bookingId) return
 setStartingCall(true)
 setCallError(null)
 try {
 const url = await createOrGetDailyRoom(bookingId)
 setCallUrl(url)
 setCallActive(true)
 } catch (e) {
 setCallError(e instanceof Error ? e.message : "Failed to create video room")
 } finally {
 setStartingCall(false)
 }
 }

 function copyRef() {
 if (!bookingId) return
 const shortRef = bookingId.slice(0, 8).toUpperCase()
 navigator.clipboard.writeText(shortRef).then(() => {
 setCopied(true)
 setTimeout(() => setCopied(false), 2000)
 })
 }

 // ── Loading / error states ────────────────────────────────────────────────

 if (loading) {
 return (
 <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
 <Spinner className="size-8 text-primary" />
 <p className="text-sm text-muted-foreground">Loading confirmation…</p>
 </div>
 )
 }

 if (error || !booking) {
 return (
 <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
 <p className="text-xl font-semibold text-foreground">Booking not found</p>
 <p className="text-sm text-muted-foreground">{error}</p>
 <Link to="/tours"><Button variant="outline">Browse Tours</Button></Link>
 </div>
 )
 }

 const tour = booking.tour
 const host = booking.host ?? tour?.host
 const hostName = host?.full_name ?? "Local Host"
 const hostInitials = getHostInitials(hostName)
 const bookingDate = new Date(booking.booking_date + "T00:00:00")
 const shortRef = bookingId!.slice(0, 8).toUpperCase()
 const isVirtual = tour?.tour_type === "virtual"

 // ── Render ────────────────────────────────────────────────────────────────

 return (
 <div className="min-h-screen bg-background">
 {/* Hero confirmation banner */}
 <div
 className="relative overflow-hidden py-16"
 style={{
 background: tour?.category
 ? getTourGradient(tour.category)
 : "linear-gradient(135deg, #0D6F7322 0%, #0D6F7311 100%)",
 }}
 >
 <div className="absolute inset-0 bg-gradient-to-b from-background/30 to-background/95" />

 <div className="relative mx-auto max-w-2xl px-4 sm:px-6 text-center">
 {/* Animated check icon */}
 <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-teal/20 ring-4 ring-teal/30">
 <CheckCircle2 className="size-10 text-teal" />
 </div>

 <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
 Booking Confirmed!
 </h1>
 <p className="mt-3 text-base text-muted-foreground">
 Your experience is booked. {host?.full_name ?? "Your host"} will be in touch shortly.
 </p>

 {/* Reference number chip */}
 <button
 onClick={copyRef}
 className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-mono font-semibold text-primary transition-colors hover:bg-primary/20"
 >
 REF #{shortRef}
 {copied ? (
 <CheckCircle2 className="size-3.5 text-teal" />
 ) : (
 <Copy className="size-3.5" />
 )}
 </button>
 <p className="mt-1.5 text-xs text-muted-foreground">
 {copied ? "Copied!" : "Click to copy your reference number"}
 </p>
 </div>
 </div>

 {/* Main content */}
 <div className="mx-auto max-w-2xl px-4 sm:px-6 pb-24 pt-8">
 {/* Status badge */}
 <div className="mb-6 flex items-center justify-between">
 <h2 className="text-lg font-semibold text-foreground">Booking details</h2>
 <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
 Pending confirmation
 </Badge>
 </div>

 {/* Tour card */}
 {tour && (
 <div className="rounded-2xl border border-border bg-card p-5">
 {/* Tour header */}
 <div className="flex items-start gap-4">
 <div
 className="flex size-16 shrink-0 items-center justify-center rounded-xl"
 style={{ background: getTourGradient(tour.category) }}
 >
 <MapPin className="size-7 text-white/50" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <h3 className="text-base font-semibold text-foreground">{tour.title}</h3>
 {isVirtual && (
 <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
 <Wifi className="size-3" />
 Virtual
 </span>
 )}
 </div>
 <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
 <Star className="size-3 fill-primary text-primary" />
 <span>{tour.rating.toFixed(1)}</span>
 <span>· {tour.review_count} reviews</span>
 </div>
 </div>
 </div>

 <Separator className="my-4" />

 {/* Booking info grid */}
 <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
 <div className="space-y-1">
 <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
 <CalendarDays className="size-3.5 text-primary" />
 Date
 </dt>
 <dd className="font-semibold text-foreground">
 {format(bookingDate, "d MMM yyyy")}
 </dd>
 <dd className="text-xs text-muted-foreground">
 {format(bookingDate, "EEEE")}{booking.booking_time ? ` @ ${booking.booking_time.substring(0, 5)}` : ""}
 </dd>
 </div>

 <div className="space-y-1">
 <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
 <Clock className="size-3.5 text-primary" />
 Duration
 </dt>
 <dd className="font-semibold text-foreground">{tour.duration_hours}h</dd>
 </div>

 <div className="space-y-1">
 <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
 <Users className="size-3.5 text-primary" />
 Guests
 </dt>
 <dd className="font-semibold text-foreground">
 {booking.guest_count} {booking.guest_count === 1 ? "guest" : "guests"}
 </dd>
 </div>

 <div className="space-y-1">
 <dt className="text-xs text-muted-foreground">Total paid</dt>
 <dd className="font-bold text-primary">
 {formatTourPrice(booking.total_price, tour.currency)}
 </dd>
 </div>
 </dl>

 <Separator className="my-4" />

        {/* Host info */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-11 shrink-0">
              <AvatarFallback className="bg-primary/20 text-sm font-semibold text-primary">
                {hostInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground">Your host</p>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground">{hostName}</p>
                {host?.is_verified && <BadgeCheck className="size-3.5 text-primary" />}
              </div>
              {host?.location && (
                <p className="text-xs text-muted-foreground">{host.location}</p>
              )}
            </div>
          </div>
          {booking.host_id && (
            <DirectMessageButton
              hostId={booking.host_id}
              hostName={hostName}
              bookingId={booking.id}
              tourId={tour?.id}
              variant="outline"
              size="sm"
              label="Message Host"
            />
          )}
        </div>
      </div>
      )}

        {/* Live Location Map for In-Person Tours */}
        {tour && !isVirtual && (
          <div className="mt-4">
            <LiveLocationMap
              hostId={booking.host_id}
              hostName={hostName}
              tourLatitude={Number(tour.latitude || -1.2863)}
              tourLongitude={Number(tour.longitude || 36.8172)}
              tourTitle={tour.title}
            />
          </div>
        )}

        {/* Direct Chat with Host Card */}
        {booking.host_id && (
          <div className="mt-4 rounded-2xl border border-primary/25 bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-col sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MessageSquare className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Direct Chat with {hostName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ask questions, coordinate meeting points, and stay connected with your host.
                  </p>
                </div>
              </div>
              <DirectMessageButton
                hostId={booking.host_id}
                hostName={hostName}
                bookingId={booking.id}
                tourId={tour?.id}
                variant="default"
                size="default"
                label="Start Chat with Host"
                className="w-full sm:w-auto shrink-0 bg-primary text-primary-foreground font-bold shadow-md hover:shadow-lg min-h-[44px]"
              />
            </div>
          </div>
        )}

        {/* Video room card */}
 <div className="mt-4 rounded-2xl border border-border bg-card p-5">
 <div className="flex items-start gap-3">
 <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
 <Video className="size-5 text-primary" />
 </div>
 <div className="flex-1">
 <p className="font-semibold text-foreground">Live Video Call</p>
 <p className="mt-0.5 text-sm text-muted-foreground">
 {isVirtual
 ? "Start a live video session with your host directly from here."
 : "Join a pre-tour video briefing with your host before your in-person experience."}
 </p>

 {callError && (
 <p className="mt-2 text-xs text-destructive">{callError}</p>
 )}

 <div className="mt-3 flex flex-col gap-2.5">
 {!canJoin && (
 <p className="text-xs text-amber-400 font-semibold bg-amber-400/10 border border-amber-400/20 p-2.5 rounded-xl">
 Your tour starts at {booking.booking_time ? booking.booking_time.substring(0, 5) : "09:00"}. You will be able to join 5 minutes before. ({countdownText})
 </p>
 )}
 {canJoin && (
 <p className="text-xs text-teal font-semibold bg-teal-500/10 border border-teal-500/20 p-2.5 rounded-xl">
 ⏱️ {countdownText} — You can join the call now!
 </p>
 )}
 <div className="flex flex-wrap gap-2 mt-1">
 {callUrl ? (
 <>
 <Button
 size="sm"
 className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
 onClick={() => setCallActive((v) => !v)}
 disabled={!canJoin}
 >
 <Video className="size-3.5" />
 {callActive ? "Minimise Call" : "Open Call"}
 </Button>
 <a href={callUrl} target="_blank" rel="noopener noreferrer">
 <Button 
 size="sm" 
 variant="outline" 
 className="rounded-full gap-1.5"
 disabled={!canJoin}
 >
 <ArrowRight className="size-3.5" />
 Open in New Tab
 </Button>
 </a>
 </>
 ) : (
 <Button
 size="sm"
 className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
 onClick={handleStartCall}
 disabled={startingCall || !canJoin}
 >
 {startingCall ? (
 <>
 <Spinner className="size-3.5 text-white animate-spin" />
 Creating room…
 </>
 ) : (
 <>
 <Video className="size-3.5" />
 Start Live Call
 </>
 )}
 </Button>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Embedded Daily.co iframe */}
 {callActive && callUrl && (
 <div className="mt-5">
 <div className="relative overflow-hidden rounded-xl border border-primary/20" style={{ height: 500 }}>
 <iframe
 src={callUrl}
 allow="camera; microphone; fullscreen; display-capture; autoplay"
 style={{
 width: "100%",
 height: "100%",
 border: "none",
 }}
 title="Live video call"
 />
 </div>
 <p className="mt-2 text-center text-xs text-muted-foreground">
 Share this page link with your host so they can join the same room.
 </p>
 </div>
 )}
 </div>

 {/* Tipping Section */}
 {booking.status === "completed" && (
 <div className="mt-4 rounded-2xl border border-border bg-card shadow-modern p-6 space-y-4 shadow-xl relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-primary/5 pointer-events-none" />
 <div className="relative z-10 space-y-4">
 <div className="flex items-center gap-2">
 <Heart className="size-5 text-rose-400 fill-rose-400/20" />
 <h2 className="text-base font-bold text-foreground">Leave a tip for your host</h2>
 <span className="ml-auto text-xs text-muted-foreground bg-muted/80 rounded-full px-2.5 py-1">Optional</span>
 </div>
 <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
 100% of your tip goes directly to {hostName} (after the standard 20% platform fee). Show your appreciation for their time, hospitality, and local knowledge!
 </p>
 <div className="flex flex-wrap gap-2 pt-1">
 {([5, 10, 15] as number[]).map((pct) => (
 <button
 key={pct}
 type="button"
 onClick={() => { setTipPercent(tipPercent === pct ? null : pct); setCustomTip("") }}
 className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
 tipPercent === pct
 ? "bg-rose-500/20 border-rose-500 text-rose-400"
 : "border-border text-muted-foreground hover:border-rose-400 hover:text-rose-400"
 }`}
 >
 {pct}% · {formatTourPrice(Math.round(subtotal * pct / 100), booking.currency || "KES")}
 </button>
 ))}
 <button
 type="button"
 onClick={() => { setTipPercent("custom"); }}
 className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
 tipPercent === "custom"
 ? "bg-rose-500/20 border-rose-500 text-rose-400"
 : "border-border text-muted-foreground hover:border-rose-400 hover:text-rose-400"
 }`}
 >
 Custom
 </button>
 {tipPercent !== null && (
 <button
 type="button"
 onClick={() => { setTipPercent(null); setCustomTip("") }}
 className="rounded-full border border-border text-muted-foreground hover:text-foreground px-4 py-1.5 text-sm transition-colors"
 >
 No tip
 </button>
 )}
 </div>

 {tipPercent === "custom" && (
 <div className="flex items-center gap-2 max-w-[240px] pt-1">
 <span className="text-sm text-muted-foreground shrink-0">{booking.currency || "KES"}</span>
 <input
 type="number"
 min="1"
 value={customTip}
 onChange={(e) => setCustomTip(e.target.value)}
 placeholder="Enter amount"
 className="flex-1 rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 )}

 {tipAmount > 0 && (
 <div className="space-y-3 pt-1">
 <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-border/45">
 You are adding <strong className="text-foreground">{formatTourPrice(tipAmount, booking.currency || "KES")}</strong> tip. Your host will receive <strong className="text-foreground">{formatTourPrice(Math.round(tipAmount * 0.8), booking.currency || "KES")}</strong> after the platform fee.
 </p>
 <Button
 onClick={handleSendTip}
 disabled={tipping}
 className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold shadow-lg shadow-rose-500/10 gap-2"
 >
 {tipping ? "Processing..." : `Send ${formatTourPrice(tipAmount, booking.currency || "KES")} Tip`}
 </Button>
 </div>
 )}

 {tipError && (
 <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
 {tipError}
 </p>
 )}
 </div>
 </div>
 )}

 {/* Traveller summary */}
 <div className="mt-4 rounded-2xl border border-border bg-card p-5">
 <p className="mb-3 text-sm font-semibold text-foreground">Your details on file</p>
 <dl className="space-y-2 text-sm">
 <div className="flex justify-between">
 <dt className="text-muted-foreground">Name</dt>
 <dd className="font-medium text-foreground">{booking.guest_name}</dd>
 </div>
 <div className="flex justify-between">
 <dt className="text-muted-foreground">Email</dt>
 <dd className="font-medium text-foreground">{booking.guest_email}</dd>
 </div>
 <div className="flex justify-between">
 <dt className="text-muted-foreground">Phone</dt>
 <dd className="font-medium text-foreground">{booking.guest_phone}</dd>
 </div>
 {booking.notes && (
 <div className="flex flex-col gap-0.5 pt-1">
 <dt className="text-muted-foreground">Special requests</dt>
 <dd className="text-foreground">{booking.notes}</dd>
 </div>
 )}
 </dl>
 </div>

 {/* CTA */}
 <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
 <Button
 size="lg"
 className="w-full sm:w-auto rounded-full px-8 bg-teal hover:bg-teal/90 text-white font-semibold"
 onClick={() => navigate(`/messages?bookingId=${booking.id}`)}
 >
 <MessageSquare className="mr-2 size-4" />
 Message Host
 </Button>
 <ReviewForm
 bookingId={booking.id}
 bookingStatus={booking.status}
 triggerVariant="outline"
 triggerSize="lg"
 triggerClassName="w-full sm:w-auto rounded-full px-8 font-semibold"
 />
 <Link to="/dashboard" className="w-full sm:w-auto">
 <Button size="lg" variant="outline" className="w-full rounded-full px-8 font-semibold">
 <LayoutDashboard className="mr-2 size-4" />
 View Dashboard
 </Button>
 </Link>
 <Link to="/tours" className="w-full sm:w-auto">
 <Button size="lg" variant="outline" className="w-full rounded-full px-8">
 Browse more tours
 </Button>
 </Link>
 </div>

 <p className="mt-4 text-center text-xs text-muted-foreground">
 A confirmation email has been sent to <strong>{booking.guest_email}</strong>
 </p>
 </div>
 {/* ChatDialog removed - direct page navigation implemented */}
 </div>
 )
}
