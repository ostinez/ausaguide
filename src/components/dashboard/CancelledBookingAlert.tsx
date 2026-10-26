import { useState } from "react"
import { AlertCircle, RefreshCw, DollarSign, MessageSquare, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import type { Booking } from "@/lib/types"
import { sendRefundRequestAdminAlert } from "@/lib/api/emails"
import ReviewForm from "@/components/ui/ReviewForm"
import { useNavigate } from "react-router-dom"

interface CancelledBookingAlertProps {
  booking: Booking
  onRefresh?: () => void
  onChat?: (booking: Booking) => void
}

export function CancelledBookingAlert({
  booking,
  onRefresh,
  onChat,
}: CancelledBookingAlertProps) {
  const navigate = useNavigate()
  const [requestingRefund, setRequestingRefund] = useState(false)
  const isPendingRefund = booking.dispute_status === "pending_refund"

  const handleRequestRefund = async () => {
    setRequestingRefund(true)
    try {
      // 1. Update dispute_status to pending_refund
      const { error } = await supabase
        .from("bookings")
        .update({
          dispute_status: "pending_refund",
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id)

      if (error) throw error

      // 2. Dispatch email to Admin
      await sendRefundRequestAdminAlert(
        booking.id,
        booking.tour?.title || "Tour Experience",
        booking.guest_name || "Traveler",
        booking.guest_email || "",
        booking.total_price || 0,
        booking.currency || "KES"
      )

      toast.success("Refund request submitted to Admin! You will be contacted shortly.")
      if (onRefresh) onRefresh()
    } catch (err: any) {
      console.error("Refund request error:", err)
      toast.error(err.message || "Failed to submit refund request.")
    } finally {
      setRequestingRefund(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-[#16161A] to-rose-950/20 p-4 md:p-5 shadow-modern transition-all duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0 mt-0.5 sm:mt-0">
            <AlertCircle className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-white text-sm sm:text-base">
                Booking Cancelled: {booking.tour?.title || "Tour Experience"}
              </h4>
              <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wide">
                Cancelled by Host
              </Badge>
              {isPendingRefund && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-semibold">
                  Refund Pending Review
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total Amount: <span className="font-semibold text-white">{booking.currency || "KES"} {booking.total_price.toLocaleString()}</span> • Scheduled: {new Date(booking.booking_date).toLocaleDateString("en-KE", { dateStyle: "medium" })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:shrink-0 w-full sm:w-auto">
          {/* Review Form - travellers can still review cancelled tours */}
          <ReviewForm
            bookingId={booking.id}
            bookingStatus={booking.status}
            tourId={booking.tour_id}
            hostId={booking.host_id}
            travelerId={localStorage.getItem("user_id") ?? booking.guest_id ?? undefined}
            triggerVariant="outline"
            triggerSize="sm"
            triggerClassName="border-border/60 hover:border-amber-400 text-xs text-amber-400 hover:text-amber-300"
            onSuccess={onRefresh}
          />

          {/* Reschedule Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/tours?reschedule=${booking.id}`)}
            className="border-primary/40 text-primary hover:bg-primary/10 text-xs font-semibold rounded-full gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Reschedule
          </Button>

          {/* Request Refund Button */}
          {isPendingRefund ? (
            <Button
              size="sm"
              variant="ghost"
              disabled
              className="text-amber-400 bg-amber-500/10 cursor-default text-xs font-semibold rounded-full gap-1.5"
            >
              <CheckCircle className="size-3.5" />
              Refund Requested
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              onClick={handleRequestRefund}
              disabled={requestingRefund}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-full gap-1.5 shadow-sm"
            >
              <DollarSign className="size-3.5" />
              {requestingRefund ? "Submitting..." : "Request Refund"}
            </Button>
          )}

          {/* Contact Host / Chat */}
          {onChat && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onChat(booking)}
              className="text-muted-foreground hover:text-white text-xs rounded-full"
            >
              <MessageSquare className="size-3.5 mr-1" />
              Chat
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
