import { useState } from "react"
import { Calendar, Clock, Users, Check, X, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { acceptBooking, declineBooking } from "@/lib/booking-utils"
import DeclineModal from "./DeclineModal"
import { toast } from "sonner"

interface BookingRequestCardProps {
  booking: {
    booking_id: string
    tour_name: string
    traveler_name: string
    date: string
    time?: string
    guests: number
    amount: number
    currency: string
    status?: string
  }
  hostId?: string
  currentUserId?: string
  isHost?: boolean
  onActionComplete?: () => void
}

export default function BookingRequestCard({
  booking,
  hostId,
  currentUserId,
  isHost = false,
  onActionComplete,
}: BookingRequestCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)

  const effectiveHostId = hostId || currentUserId || ""

  const handleAccept = async () => {
    if (!effectiveHostId) {
      toast.error("Host account not identified.")
      return
    }
    setIsLoading(true)
    try {
      await acceptBooking(booking.booking_id, effectiveHostId)
      toast.success("Booking accepted! Video room created and confirmation sent.")
      onActionComplete?.()
    } catch (error: any) {
      console.error("Accept error:", error)
      toast.error(error?.message || "Failed to accept booking. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecline = async (reason: string) => {
    if (!effectiveHostId) {
      toast.error("Host account not identified.")
      return
    }
    setIsLoading(true)
    try {
      await declineBooking(booking.booking_id, effectiveHostId, reason)
      setShowDeclineModal(false)
      toast.info("Booking declined and notification sent to traveler.")
      onActionComplete?.()
    } catch (error: any) {
      console.error("Decline error:", error)
      toast.error(error?.message || "Failed to decline booking. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex justify-center my-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-card overflow-hidden shadow-modern">
          {/* Header banner */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border-b border-primary/20">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sparkles className="size-4 text-primary" />
              <span>New Booking Request</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Awaiting Approval
            </span>
          </div>

          {/* Details body */}
          <div className="p-4 space-y-3 text-xs">
            <h4 className="font-bold text-foreground text-sm leading-snug">
              {booking.tour_name}
            </h4>

            <div className="grid grid-cols-2 gap-2 text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/60">
              <div className="flex items-center gap-1.5 text-foreground">
                <span className="font-semibold text-muted-foreground text-[10px]">Traveler:</span>
                <span className="truncate">{booking.traveler_name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-foreground">
                <Calendar className="size-3.5 text-primary shrink-0" />
                <span className="truncate">{booking.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-foreground">
                <Clock className="size-3.5 text-primary shrink-0" />
                <span className="truncate">{booking.time || "Flexible"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-foreground">
                <Users className="size-3.5 text-primary shrink-0" />
                <span>{booking.guests} {booking.guests === 1 ? "guest" : "guests"}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-border/60 flex items-center justify-between font-bold text-foreground">
                <span>Total Amount</span>
                <span className="text-primary text-sm font-extrabold">
                  {booking.currency || "KES"} {booking.amount?.toLocaleString() || "0"}
                </span>
              </div>
            </div>

            {/* Action buttons — only active for Host */}
            {isHost ? (
              <div className="flex gap-2.5 pt-1">
                <Button
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Accept Booking
                </Button>
                <Button
                  onClick={() => setShowDeclineModal(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1 h-10 rounded-xl border-rose-500/40 text-rose-600 hover:bg-rose-500/10 font-semibold text-xs gap-1.5"
                >
                  <X className="size-4" />
                  Decline
                </Button>
              </div>
            ) : (
              <div className="text-center py-1 text-muted-foreground text-[11px] italic">
                Awaiting host response. You will receive a confirmation message once accepted.
              </div>
            )}
          </div>
        </div>
      </div>

      <DeclineModal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        onDecline={handleDecline}
        bookingId={booking.booking_id}
      />
    </>
  )
}
