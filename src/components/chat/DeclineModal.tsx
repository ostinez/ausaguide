import { useState } from "react"
import { AlertCircle, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DeclineModalProps {
  isOpen: boolean
  onClose: () => void
  onDecline: (reason: string) => Promise<void>
  bookingId: string
}

export default function DeclineModal({
  isOpen,
  onClose,
  onDecline,
}: DeclineModalProps) {
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      alert("Please provide a reason for declining.")
      return
    }
    setIsSubmitting(true)
    try {
      await onDecline(reason.trim())
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-lg">
            <AlertCircle className="size-5" />
            <span>Decline Booking Request</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          The traveler will see this reason. Please provide a clear, polite explanation (e.g., schedule conflict, fully booked, or weather constraints).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
              Reason for declining *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., I'm unavailable on this specific date/time, but available next weekend..."
              rows={3}
              className="w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40 resize-none transition"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 font-semibold gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Declining...
                </>
              ) : (
                "Decline Booking"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
