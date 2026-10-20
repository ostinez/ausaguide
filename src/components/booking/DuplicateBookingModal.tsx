import { Link } from "react-router-dom"
import { CalendarCheck, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DuplicateBookingModalProps {
  isOpen: boolean
  onClose: () => void
  tourTitle?: string
}

export function DuplicateBookingModal({
  isOpen,
  onClose,
  tourTitle,
}: DuplicateBookingModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 ring-8 ring-amber-500/5 text-amber-500">
          <CalendarCheck className="size-7" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-foreground">
            Active Booking Found
          </h3>
          {tourTitle && (
            <p className="text-xs font-medium text-primary">
              {tourTitle}
            </p>
          )}
          <p className="text-sm text-muted-foreground leading-relaxed">
            You already have an active booking for this tour. Manage it in your dashboard.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <Link to="/dashboard" className="w-full">
            <Button className="w-full rounded-full gap-2 font-semibold">
              Manage in Dashboard
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full rounded-full text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DuplicateBookingModal
