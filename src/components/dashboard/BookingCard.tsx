import { useNavigate } from "react-router-dom"
import { MessageSquare, Calendar, Users, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface BookingCardProps {
  booking: {
    id: string
    tour_id?: string
    tour?: { title: string }
    tours?: { title: string }
    booking_date?: string
    date?: string
    guest_count?: number
    participants?: number
    total_price?: number
    amount?: number
    currency?: string
    status: string
    host_id?: string
    guest_id?: string
    traveler_id?: string
  }
  isHost?: boolean
}

export default function BookingCard({ booking, isHost }: BookingCardProps) {
  const navigate = useNavigate()

  const tourTitle = booking.tour?.title || booking.tours?.title || "Tour Experience"
  const bookingDate = booking.booking_date || booking.date || "Date"
  const guests = booking.guest_count || booking.participants || 1
  const amount = booking.total_price || booking.amount || 0
  const currency = booking.currency || "KES"

  const handleChatClick = async () => {
    navigate(`/messages?bookingId=${booking.id}`)
  }

  const statusColor =
    booking.status === "confirmed"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
      : booking.status === "awaiting_confirmation" || booking.status === "pending"
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
      : booking.status === "cancelled" || booking.status === "declined"
      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
      : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30"

  return (
    <div className="bg-card rounded-2xl border border-border p-4 hover:shadow-modern transition-all duration-200 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-foreground text-sm leading-snug">{tourTitle}</h3>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor}`}>
          {booking.status.replace("_", " ").toUpperCase()}
        </span>
      </div>

      <div className="text-xs text-muted-foreground space-y-1.5 bg-muted/40 p-3 rounded-xl border border-border/50">
        <p className="flex items-center gap-1.5 text-foreground">
          <Calendar className="size-3.5 text-primary" /> {bookingDate}
        </p>
        <p className="flex items-center gap-1.5 text-foreground">
          <Users className="size-3.5 text-primary" /> {guests} guest{guests !== 1 ? "s" : ""}
        </p>
        <p className="flex items-center gap-1.5 text-foreground font-bold">
          <DollarSign className="size-3.5 text-primary" /> {currency} {amount.toLocaleString()}
        </p>
      </div>

      <Button
        onClick={handleChatClick}
        variant="outline"
        className="w-full h-9 rounded-xl border-primary/30 text-primary hover:bg-primary/10 text-xs font-semibold gap-1.5"
      >
        <MessageSquare className="size-3.5" />
        Chat with {isHost ? "Traveler" : "Host"}
      </Button>
    </div>
  )
}
