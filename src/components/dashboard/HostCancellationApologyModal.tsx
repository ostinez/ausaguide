import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, ShieldAlert, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import type { Booking } from "@/lib/types"
import { sendHostCancellationAdminAlert } from "@/lib/api/emails"

interface HostCancellationApologyModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking | null
  currentStrikes?: number
  onSuccess: () => void
}

export function HostCancellationApologyModal({
  isOpen,
  onClose,
  booking,
  currentStrikes = 0,
  onSuccess,
}: HostCancellationApologyModalProps) {
  const [apologyMessage, setApologyMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!booking) return null

  const handleCancelBooking = async () => {
    const trimmed = apologyMessage.trim()
    if (!trimmed || trimmed.length < 15) {
      toast.error("Please provide a meaningful explanation (at least 15 characters).")
      return
    }

    setSubmitting(true)
    try {
      // 1. Insert strike for host
      const { error: strikeError } = await supabase
        .from("strikes")
        .insert({
          host_id: booking.host_id,
          reason: trimmed,
          booking_id: booking.id,
        })
        .select()

      if (strikeError) {
        console.warn("Could not insert strike directly:", strikeError)
      }

      // Count total strikes for this host
      const { count: totalStrikes } = await supabase
        .from("strikes")
        .select("*", { count: "exact", head: true })
        .eq("host_id", booking.host_id)

      const updatedStrikes = (totalStrikes ?? currentStrikes) + 1

      // 2. Update booking status to cancelled
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id)

      if (bookingError) throw bookingError

      // 3. Notify Admin & Guest via send-email
      const hostName = (booking as any).host?.full_name || "Host"
      const tourTitle = booking.tour?.title || "Tour Experience"
      const travelerName = booking.guest_name || "Traveler"
      const travelerEmail = booking.guest_email || ""

      await sendHostCancellationAdminAlert(
        booking.id,
        tourTitle,
        hostName,
        booking.host_id,
        travelerName,
        travelerEmail,
        trimmed,
        updatedStrikes
      )

      toast.success("Booking cancelled. Cancellation notice & strike registered.")
      setApologyMessage("")
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error("Cancellation error:", err)
      toast.error(err.message || "Failed to cancel booking. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !submitting && !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] border-rose-500/30 bg-[#16161A] text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-400">
            <div className="p-2 rounded-full bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Cancel Booking & Issue Apology
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            Cancelling a confirmed tour disrupts the traveler's itinerary and impacts your host trust score.
          </DialogDescription>
        </DialogHeader>

        {/* Strike Warning Card */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <ShieldAlert className="size-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 space-y-1">
            <p className="font-semibold text-amber-300">
              Strike Policy: {currentStrikes} / 10 strikes currently recorded
            </p>
            <p className="text-muted-foreground">
              A cancellation adds 1 strike to your account. Hosts with 10 strikes are automatically flagged for suspension and administrative review.
            </p>
          </div>
        </div>

        {/* Apology Input */}
        <div className="space-y-2 py-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mandatory Apology Message to Traveler *
          </label>
          <Textarea
            value={apologyMessage}
            onChange={(e) => setApologyMessage(e.target.value)}
            placeholder="Dear traveler, I sincerely apologize, but due to unforeseen circumstances..."
            className="min-h-[120px] bg-background/50 border-border/60 focus:border-rose-400 text-sm leading-relaxed"
            disabled={submitting}
          />
          <p className="text-[11px] text-muted-foreground">
            This message will be dispatched directly to <span className="text-white font-medium">{booking.guest_name}</span> and copied to the Ausaguide Admin.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
            className="text-muted-foreground hover:text-white"
          >
            Keep Booking
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancelBooking}
            disabled={submitting || apologyMessage.trim().length < 15}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Confirm Cancellation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
