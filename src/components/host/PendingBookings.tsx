import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Calendar, Users, MessageSquare, Check, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { updateBookingStatus } from "@/lib/api/bookings"
import { fetchBookingsByHostId } from "@/lib/api/hosts"
import type { Booking } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export interface PendingBookingsProps {
 hostId: string
 onBookingStatusUpdated?: (booking: Booking) => void
 onOpenChat?: (booking: Booking) => void
 className?: string
}

export function PendingBookings({
 hostId,
 onBookingStatusUpdated,
 onOpenChat,
 className,
}: PendingBookingsProps) {
 const navigate = useNavigate()
 const [pendingBookings, setPendingBookings] = useState<Booking[]>([])
 const [loading, setLoading] = useState(true)
 const [actionLoading, setActionLoading] = useState<{ id: string; action: "accept" | "decline" } | null>(null)
 const [declineModalBooking, setDeclineModalBooking] = useState<Booking | null>(null)
 const [declineReason, setDeclineReason] = useState("")

 const loadPending = useCallback(async () => {
 if (!hostId) return
 try {
 const all = await fetchBookingsByHostId(hostId)
 const pending = all.filter((b: Booking) => b.status === "pending")
 setPendingBookings(pending)
 } catch (err) {
 console.error("[PendingBookings] Error fetching pending bookings:", err)
 } finally {
 setLoading(false)
 }
 }, [hostId])

 useEffect(() => {
 loadPending()

 if (!hostId) return

 // Realtime channel for bookings table changes
 const channel = supabase
 .channel(`pending-bookings-host-${hostId}`)
 .on(
 "postgres_changes",
 {
 event: "*",
 schema: "public",
 table: "bookings",
 filter: `host_id=eq.${hostId}`,
 },
 () => {
 loadPending()
 }
 )
 .subscribe()

 return () => {
 channel.unsubscribe()
 supabase.removeChannel(channel)
 }
 }, [hostId, loadPending])

 const handleAccept = async (booking: Booking) => {
 setActionLoading({ id: booking.id, action: "accept" })
 try {
 const updated = await updateBookingStatus(booking.id, "confirmed")
 toast.success(`Booking request from ${booking.guest_name} accepted! Chat enabled.`)
 setPendingBookings((prev) => prev.filter((b) => b.id !== booking.id))
 onBookingStatusUpdated?.(updated)
 } catch (err: any) {
 toast.error(err.message || "Failed to accept booking")
 } finally {
 setActionLoading(null)
 }
 }

 const handleDecline = async () => {
 if (!declineModalBooking) return
 if (!declineReason.trim()) {
 toast.error("Please provide a reason for declining.")
 return
 }

 const b = declineModalBooking
 setActionLoading({ id: b.id, action: "decline" })
 try {
 const updated = await updateBookingStatus(b.id, "declined", declineReason.trim())
 toast.success(`Booking declined and refund initiated.`)
 setPendingBookings((prev) => prev.filter((item) => item.id !== b.id))
 onBookingStatusUpdated?.(updated)
 setDeclineModalBooking(null)
 setDeclineReason("")
 } catch (err: any) {
 toast.error(err.message || "Failed to decline booking")
 } finally {
 setActionLoading(null)
 }
 }

 const handleChat = (b: Booking) => {
 if (onOpenChat) {
 onOpenChat(b)
 } else {
 navigate(`/messages?bookingId=${b.id}`)
 }
 }

 if (loading) {
 return (
 <Card className={className}>
 <CardContent className="flex items-center justify-center py-8">
 <Spinner className="size-6 text-primary animate-spin" />
 </CardContent>
 </Card>
 )
 }

 return (
 <Card className={className}>
 <CardHeader>
 <div className="flex items-center justify-between">
 <div>
 <CardTitle className="text-base flex items-center gap-2">
 <Clock className="size-4 text-amber-500" />
 Pending Booking Requests
 </CardTitle>
 <CardDescription>
 Review and confirm requests from travelers. Confirming enables instant real-time chat.
 </CardDescription>
 </div>
 {pendingBookings.length > 0 && (
 <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
 {pendingBookings.length} pending
 </span>
 )}
 </div>
 </CardHeader>

 <CardContent className="space-y-3">
 {pendingBookings.length === 0 ? (
 <div className="text-center py-8 px-4 text-muted-foreground text-sm">
 <Check className="size-8 mx-auto mb-2 text-emerald-500/50" />
 <p>You have no pending booking requests right now.</p>
 </div>
 ) : (
 pendingBookings.map((b) => {
 const isAccepting = actionLoading?.id === b.id && actionLoading.action === "accept"
 const dateStr = b.booking_date ? format(new Date(b.booking_date), "MMM d, yyyy") : "Date TBD"

 return (
 <div
 key={b.id}
 className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
 >
 {/* Guest info */}
 <div className="flex items-center gap-3 min-w-0 flex-1">
 <Avatar className="size-10 shrink-0 border border-border">
 <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
 {b.guest_name
 ?.split(" ")
 .map((n) => n[0])
 .join("")
 .slice(0, 2) || "G"}
 </AvatarFallback>
 </Avatar>

 <div className="min-w-0 flex-1">
 <p className="font-semibold text-sm text-foreground truncate">
 {b.guest_name}
 </p>
 <p className="text-xs text-primary font-medium truncate mt-0.5">
 {b.tour?.title || "Tour Experience"}
 </p>
 <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
 <span className="flex items-center gap-1">
 <Calendar className="size-3" />
 {dateStr}
 </span>
 <span className="flex items-center gap-1">
 <Users className="size-3" />
 {b.guest_count} {b.guest_count === 1 ? "guest" : "guests"}
 </span>
 <span className="font-semibold text-foreground">
 ${b.total_price?.toLocaleString() || "0"} USD
 </span>
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
 <Button
 size="sm"
 variant="ghost"
 className="rounded-full text-muted-foreground hover:text-foreground"
 onClick={() => handleChat(b)}
 >
 <MessageSquare className="size-3.5 mr-1" />
 Chat
 </Button>

 <Button
 size="sm"
 variant="outline"
 className="rounded-full border-destructive/50 text-destructive hover:bg-destructive/10"
 onClick={() => {
 setDeclineModalBooking(b)
 setDeclineReason("")
 }}
 disabled={actionLoading !== null}
 >
 Decline & Refund
 </Button>

 <Button
 size="sm"
 className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
 onClick={() => handleAccept(b)}
 disabled={actionLoading !== null}
 >
 {isAccepting ? (
 <Spinner className="size-3.5 mr-1 animate-spin" />
 ) : (
 <Check className="size-3.5 mr-1" />
 )}
 Accept
 </Button>
 </div>
 </div>
 )
 })
 )}
 </CardContent>

 {/* Decline Reason Modal */}
 {declineModalBooking && (
 <div
 onClick={() => setDeclineModalBooking(null)}
 className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
 >
 <div className="flex items-center gap-2 text-destructive">
 <AlertCircle className="size-5" />
 <h3 className="font-semibold text-base">Decline Booking Request</h3>
 </div>
 <p className="text-xs text-muted-foreground">
 Please provide a reason for declining the booking from{" "}
 <span className="font-semibold text-foreground">{declineModalBooking.guest_name}</span>. This will cancel the payment authorization and notify the guest.
 </p>

 <textarea
 className="w-full rounded-xl border border-border bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
 placeholder="E.g., I am unavailable due to a prior commitment..."
 rows={3}
 value={declineReason}
 onChange={(e) => setDeclineReason(e.target.value)}
 autoFocus
 />

 <div className="flex justify-end gap-2 pt-2">
 <Button
 variant="ghost"
 size="sm"
 className="rounded-full"
 onClick={() => setDeclineModalBooking(null)}
 >
 Cancel
 </Button>
 <Button
 variant="destructive"
 size="sm"
 className="rounded-full"
 onClick={handleDecline}
 disabled={!declineReason.trim() || actionLoading !== null}
 >
 Confirm Decline & Refund
 </Button>
 </div>
 </div>
 </div>
 )}
 </Card>
 )
}
