import { CheckCircle, Video } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BookingConfirmedCardProps {
  content: {
    booking_id?: string
    tour_name?: string
    daily_room_url?: string | null
    daily_room_id?: string | null
    message?: string
    date?: string
    guests?: number
    total?: number
    currency?: string
  }
}

export default function BookingConfirmedCard({ content }: BookingConfirmedCardProps) {
  const tourName = content.tour_name || "Tour"
  const message = content.message || `Your booking for "${tourName}" has been confirmed by the host!`
  const roomUrl = content.daily_room_url

  return (
    <div className="flex justify-center my-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-card overflow-hidden shadow-modern">
        {/* Header banner */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
          <div className="size-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle className="size-4 text-emerald-500 stroke-[2.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
              Booking Confirmed
            </p>
            <p className="text-xs font-semibold text-foreground truncate">{tourName}</p>
          </div>
        </div>

        {/* Content body */}
        <div className="p-4 space-y-3 text-xs">
          <p className="text-foreground leading-relaxed font-medium">{message}</p>

          {roomUrl && (
            <div className="pt-2 border-t border-border/60">
              <Button
                asChild
                className="w-full h-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold gap-2 shadow-sm"
              >
                <a href={roomUrl} target="_blank" rel="noopener noreferrer">
                  <Video className="size-4" />
                  <span>Join Video Room</span>
                </a>
              </Button>
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                Powered by Daily.co video connection
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
