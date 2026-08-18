import { XCircle } from "lucide-react"

interface BookingDeclinedCardProps {
  content: {
    booking_id?: string
    tour_name?: string
    decline_reason?: string
    message?: string
  }
}

export default function BookingDeclinedCard({ content }: BookingDeclinedCardProps) {
  const tourName = content.tour_name || "Tour"
  const reason = content.decline_reason || "Host is unavailable at this time"
  const message = content.message || `❌ Your booking for "${tourName}" was declined by the host.`

  return (
    <div className="flex justify-center my-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-card overflow-hidden shadow-modern">
        {/* Header banner */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-rose-500/10 border-b border-rose-500/20">
          <div className="size-7 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
            <XCircle className="size-4 text-rose-500 stroke-[2.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">
              Booking Declined
            </p>
            <p className="text-xs font-semibold text-foreground truncate">{tourName}</p>
          </div>
        </div>

        {/* Content body */}
        <div className="p-4 space-y-2.5 text-xs">
          <p className="text-foreground leading-relaxed">{message}</p>

          <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-700 dark:text-rose-300">
            <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">Reason</span>
            <p className="italic">{reason}</p>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Any funds collected will be automatically reversed or credited back.
          </p>
        </div>
      </div>
    </div>
  )
}
