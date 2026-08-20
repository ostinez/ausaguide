import { useState, useEffect } from "react"
import {
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  Video,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export interface TourBookingInfo {
  id: string
  tour_id?: string
  tour_name: string
  booking_date: string
  booking_time?: string | null
  guest_count: number
  total_price: number
  currency: string
  status: string
  payment_status?: string
  payment_id?: string | null
  guest_name?: string | null
  guest_email?: string | null
  guest_phone?: string | null
  notes?: string | null
  meeting_point?: string | null
  created_at?: string
  daily_room_url?: string | null
}

interface HostTourBookingDetailsProps {
  booking: TourBookingInfo
  isHost?: boolean
  onStartVideoCall?: () => void
  onSendInclusions?: () => void
  variant?: "banner" | "sidebar" | "modal"
}

interface CountdownState {
  days: number
  hours: number
  minutes: number
  seconds: number
  isToday: boolean
  isPast: boolean
  isSoon: boolean
  formatted: string
}

function calculateCountdown(dateStr: string, timeStr?: string | null): CountdownState {
  try {
    let targetTime = new Date(dateStr)
    if (timeStr) {
      const [h, m] = timeStr.split(":")
      targetTime.setHours(parseInt(h || "9", 10), parseInt(m || "0", 10), 0, 0)
    } else {
      targetTime.setHours(9, 0, 0, 0) // default 9 AM
    }

    const now = new Date()
    const diff = targetTime.getTime() - now.getTime()

    if (diff <= 0) {
      const hoursAgo = Math.abs(diff) / (1000 * 60 * 60)
      if (hoursAgo < 12) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isToday: true,
          isPast: false,
          isSoon: true,
          formatted: "🟢 Tour is Happening Today!",
        }
      }
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isToday: false,
        isPast: true,
        isSoon: false,
        formatted: "🏁 Tour Completed",
      }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    const isToday = days === 0 && now.toDateString() === targetTime.toDateString()
    const isSoon = days === 0 && hours < 6

    let formatted = ""
    if (days > 0) {
      formatted = `${days}d ${hours}h ${minutes}m remaining`
    } else if (hours > 0) {
      formatted = `${hours}h ${minutes}m ${seconds}s remaining`
    } else {
      formatted = `${minutes}m ${seconds}s remaining`
    }

    return {
      days,
      hours,
      minutes,
      seconds,
      isToday,
      isPast: false,
      isSoon,
      formatted,
    }
  } catch {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isToday: false,
      isPast: false,
      isSoon: false,
      formatted: "Scheduled",
    }
  }
}

export default function HostTourBookingDetails({
  booking,
  isHost = true,
  onStartVideoCall,
  onSendInclusions,
  variant = "sidebar",
}: HostTourBookingDetailsProps) {
  const [countdown, setCountdown] = useState<CountdownState>(() =>
    calculateCountdown(booking.booking_date, booking.booking_time)
  )
  const [expanded, setExpanded] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateCountdown(booking.booking_date, booking.booking_time))
    }, 1000)
    return () => clearInterval(timer)
  }, [booking.booking_date, booking.booking_time])

  const copyBookingRef = () => {
    navigator.clipboard.writeText(booking.id)
    setCopiedId(true)
    toast.success("Booking reference copied!")
    setTimeout(() => setCopiedId(false), 2000)
  }

  const fmtCurrency = (val: number, currency = "KES") =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(val)

  // ─── 1. TOP CHAT BANNER VARIANT ─────────────────────────────────────────────
  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-emerald-500/10 via-card to-primary/10 border-b border-emerald-500/20 px-4 py-2.5 transition-all">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 ring-2 ring-emerald-500/20">
              <ShieldCheck className="size-4.5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-foreground truncate max-w-[200px] sm:max-w-xs">
                  {booking.tour_name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  {isHost ? "Verified Traveler Booking" : "Confirmed Booking"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Calendar className="size-3 text-primary shrink-0" />
                <span>{new Date(booking.booking_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                {booking.booking_time && <span>at {booking.booking_time.slice(0, 5)}</span>}
                <span>•</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {countdown.formatted}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onStartVideoCall && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onStartVideoCall}
                className="h-7 text-[11px] font-semibold rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20 gap-1"
              >
                <Video className="size-3.5" />
                <span className="hidden sm:inline">Call Traveler</span>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
            >
              <span className="text-[11px] mr-1">{expanded ? "Less" : "Receipt"}</span>
              {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </Button>
          </div>
        </div>

        {/* Expanded Banner Details */}
        {expanded && (
          <div className="mt-3 pt-2.5 border-t border-emerald-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs animate-in fade-in slide-in-from-top-1">
            <div className="bg-card/90 p-2.5 rounded-xl border border-border/60">
              <span className="text-[10px] text-muted-foreground block">Booking Reference</span>
              <button
                type="button"
                onClick={copyBookingRef}
                className="font-mono text-xs font-bold text-foreground flex items-center gap-1 hover:text-primary mt-0.5"
              >
                <span>#{booking.id.slice(0, 8).toUpperCase()}</span>
                {copiedId ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              </button>
            </div>

            <div className="bg-card/90 p-2.5 rounded-xl border border-border/60">
              <span className="text-[10px] text-muted-foreground block">Guests Booked</span>
              <span className="font-bold text-xs text-foreground mt-0.5 block">
                {booking.guest_count} {booking.guest_count === 1 ? "Traveler" : "Travelers"}
              </span>
            </div>

            <div className="bg-card/90 p-2.5 rounded-xl border border-border/60">
              <span className="text-[10px] text-muted-foreground block">Amount Paid</span>
              <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {fmtCurrency(booking.total_price, booking.currency)}
              </span>
            </div>

            <div className="bg-card/90 p-2.5 rounded-xl border border-border/60">
              <span className="text-[10px] text-muted-foreground block">Payment Status</span>
              <span className="font-bold text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="size-3" />
                <span>Confirmed Paid</span>
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── 2. SIDEBAR / FULL RECEIPT VARIANT ──────────────────────────────────────
  return (
    <div className="p-4 space-y-4">
      {/* Verified Receipt Header Card */}
      <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-card p-4 shadow-lg shadow-emerald-500/5">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 ring-2 ring-emerald-500/20">
              <ShieldCheck className="size-4 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                {isHost ? "Host Tour Receipt" : "Confirmed Booking"}
              </p>
              <p className="text-xs font-semibold text-foreground">Verified & Paid</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
            Confirmed
          </Badge>
        </div>

        {/* Live Countdown Timer Clock */}
        <div className="my-3.5 p-3 rounded-xl bg-card border border-emerald-500/30 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            <Clock className="size-3.5 text-emerald-600 animate-pulse" />
            <span>Tour Countdown</span>
          </div>

          <div className="flex items-center justify-center gap-2 select-none py-1">
            <div className="flex flex-col items-center">
              <span className="text-xl font-black text-foreground tabular-nums">
                {String(countdown.days).padStart(2, "0")}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase">Days</span>
            </div>
            <span className="text-lg font-bold text-emerald-500 -mt-3">:</span>
            <div className="flex flex-col items-center">
              <span className="text-xl font-black text-foreground tabular-nums">
                {String(countdown.hours).padStart(2, "0")}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase">Hours</span>
            </div>
            <span className="text-lg font-bold text-emerald-500 -mt-3">:</span>
            <div className="flex flex-col items-center">
              <span className="text-xl font-black text-foreground tabular-nums">
                {String(countdown.minutes).padStart(2, "0")}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase">Mins</span>
            </div>
            <span className="text-lg font-bold text-emerald-500 -mt-3">:</span>
            <div className="flex flex-col items-center">
              <span className="text-xl font-black text-emerald-600 tabular-nums">
                {String(countdown.seconds).padStart(2, "0")}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase">Secs</span>
            </div>
          </div>

          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">
            {countdown.formatted}
          </p>
        </div>

        {/* Tour Title & Meta */}
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground block">Booked Experience</span>
            <p className="font-bold text-foreground text-sm leading-snug">{booking.tour_name}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
            <div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3 text-primary" /> Date
              </span>
              <p className="font-semibold text-foreground mt-0.5">
                {new Date(booking.booking_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="size-3 text-primary" /> Time
              </span>
              <p className="font-semibold text-foreground mt-0.5">
                {booking.booking_time ? booking.booking_time.slice(0, 5) : "09:00 AM"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Users className="size-3 text-primary" /> Travelers
              </span>
              <p className="font-semibold text-foreground mt-0.5">
                {booking.guest_count} {booking.guest_count === 1 ? "Person" : "People"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Total Earnings</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {fmtCurrency(booking.total_price, booking.currency)}
              </p>
            </div>
          </div>

          {/* Booking Ref */}
          <div className="pt-2 border-t border-border/60 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Receipt Ref:</span>
            <button
              type="button"
              onClick={copyBookingRef}
              className="font-mono text-[11px] font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>#{booking.id.slice(0, 8).toUpperCase()}</span>
              {copiedId ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Traveler Contact Info (For Host) */}
      {isHost && (booking.guest_name || booking.guest_email || booking.guest_phone) && (
        <div className="p-3.5 rounded-2xl bg-card border border-border space-y-2.5 text-xs">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Traveler Contact Details
          </p>
          {booking.guest_name && (
            <p className="font-semibold text-foreground">{booking.guest_name}</p>
          )}
          {booking.guest_email && (
            <a
              href={`mailto:${booking.guest_email}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors truncate"
            >
              <Mail className="size-3.5 shrink-0 text-primary" />
              <span className="truncate">{booking.guest_email}</span>
            </a>
          )}
          {booking.guest_phone && (
            <a
              href={`tel:${booking.guest_phone}`}
              className="flex items-center gap-2 text-emerald-600 font-semibold hover:underline"
            >
              <Phone className="size-3.5 shrink-0" />
              <span>{booking.guest_phone}</span>
            </a>
          )}
          {booking.notes && (
            <div className="pt-2 border-t border-border/60">
              <span className="text-[10px] text-muted-foreground block">Special Requests:</span>
              <p className="text-xs text-foreground italic mt-0.5">{booking.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Host Actions */}
      {isHost && (
        <div className="space-y-2">
          {onStartVideoCall && (
            <Button
              type="button"
              onClick={onStartVideoCall}
              className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-2 shadow-sm"
            >
              <Video className="size-4" />
              <span>Start Video Call with Traveler</span>
            </Button>
          )}
          {onSendInclusions && (
            <Button
              type="button"
              variant="outline"
              onClick={onSendInclusions}
              className="w-full h-10 rounded-xl text-xs font-semibold gap-2 border-border hover:bg-muted"
            >
              <FileText className="size-4 text-emerald-500" />
              <span>Send Tour Inclusions Checklist</span>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
