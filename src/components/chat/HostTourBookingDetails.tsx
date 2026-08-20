import { useState, useEffect } from "react"
import { MessageSquare, Video, CheckCircle, Clock, Users, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  status_history?: Array<{ status: string; changed_at: string }>
}

interface HostTourBookingDetailsProps {
  booking: TourBookingInfo
  isHost?: boolean
  onStartVideoCall?: () => void
  onConfirmCompletion?: () => void
  onOpenChat?: () => void
  /** kept for back-compat */
  onSendInclusions?: () => void
  /** kept for back-compat */
  variant?: string
}

interface CountdownState {
  days: number
  hours: number
  minutes: number
  seconds: number
  isToday: boolean
  isPast: boolean
  color: string
}

function calculateCountdown(dateStr: string, timeStr?: string | null): CountdownState {
  try {
    const target = new Date(dateStr)
    if (timeStr) {
      const [h, m] = timeStr.split(":")
      target.setHours(parseInt(h || "9", 10), parseInt(m || "0", 10), 0, 0)
    } else {
      target.setHours(9, 0, 0, 0)
    }
    const now = new Date()
    const diff = target.getTime() - now.getTime()
    if (diff <= 0) {
      const hoursAgo = Math.abs(diff) / (1000 * 60 * 60)
      return {
        days: 0, hours: 0, minutes: 0, seconds: 0,
        isToday: hoursAgo < 14,
        isPast: hoursAgo >= 14,
        color: hoursAgo < 14 ? "text-emerald-500" : "text-muted-foreground",
      }
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    const isSoon = days === 0 && hours < 6
    return {
      days, hours, minutes, seconds,
      isToday: days === 0 && now.toDateString() === target.toDateString(),
      isPast: false,
      color: isSoon ? "text-amber-500" : "text-primary",
    }
  } catch {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isToday: false, isPast: true, color: "text-muted-foreground" }
  }
}

function initials(name?: string | null) {
  if (!name) return "??"
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 3)
}

function fmtDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch { return dateStr }
}

function fmtDateTime(ts: string) {
  try {
    const d = new Date(ts)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  } catch { return ts }
}

function fmtCurrency(val: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(val)
}

function statusBadgeClass(status: string) {
  switch (status?.toLowerCase()) {
    case "confirmed": return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
    case "pending":   return "bg-amber-500/15 text-amber-600 border-amber-500/30"
    case "started":   return "bg-blue-500/15 text-blue-600 border-blue-500/30"
    case "completed": return "bg-muted text-muted-foreground border-border"
    case "cancelled": return "bg-rose-500/15 text-rose-600 border-rose-500/30"
    default:          return "bg-muted text-muted-foreground border-border"
  }
}

function statusDotClass(status: string) {
  switch (status?.toLowerCase()) {
    case "confirmed": return "bg-emerald-500"
    case "pending":   return "bg-amber-400"
    case "started":   return "bg-blue-500"
    case "completed": return "bg-muted-foreground"
    case "cancelled": return "bg-rose-500"
    default:          return "bg-muted-foreground"
  }
}

export default function HostTourBookingDetails({
  booking,
  isHost = true,
  onStartVideoCall,
  onConfirmCompletion,
  onOpenChat,
}: HostTourBookingDetailsProps) {
  const [cd, setCd] = useState<CountdownState>(() =>
    calculateCountdown(booking.booking_date, booking.booking_time)
  )

  useEffect(() => {
    const t = setInterval(() =>
      setCd(calculateCountdown(booking.booking_date, booking.booking_time)), 1000)
    return () => clearInterval(t)
  }, [booking.booking_date, booking.booking_time])

  // Build timeline: always start with "pending" at created_at, then subsequent statuses
  const timeline: Array<{ status: string; changed_at: string }> = []
  if (booking.created_at) timeline.push({ status: "pending", changed_at: booking.created_at })
  if (Array.isArray(booking.status_history)) {
    booking.status_history
      .filter((e) => e.status?.toLowerCase() !== "pending")
      .forEach((e) => timeline.push(e))
  } else if (booking.status && booking.status.toLowerCase() !== "pending") {
    timeline.push({ status: booking.status, changed_at: booking.created_at || new Date().toISOString() })
  }

  return (
    <div className="p-4 space-y-3">
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">

        {/* â”€â”€ Top section: initials avatar | name/date/guests/price | status badge â”€â”€ */}
        <div className="flex items-start gap-3 p-4">
          {/* Initials avatar */}
          <div className="size-11 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-foreground tracking-tight leading-none">
              {initials(booking.guest_name)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm leading-tight uppercase truncate">
              {booking.guest_name || "Guest"}
            </p>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="size-3 shrink-0" />
                {fmtDate(booking.booking_date)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-3 shrink-0" />
                {booking.guest_count} {booking.guest_count === 1 ? "guest" : "guests"}
              </span>
              <span className="font-bold text-foreground">
                {fmtCurrency(booking.total_price, booking.currency)}
              </span>
            </div>

            {/* Live Countdown */}
            {!cd.isPast && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Clock className="size-3 text-primary shrink-0 animate-pulse" />
                {cd.isToday ? (
                  <span className="text-[11px] font-bold text-emerald-600">Happening Today!</span>
                ) : (
                  <span className={`text-[11px] font-mono font-bold tabular-nums ${cd.color}`}>
                    {String(cd.days).padStart(2, "0")}d {String(cd.hours).padStart(2, "0")}h{" "}
                    {String(cd.minutes).padStart(2, "0")}m {String(cd.seconds).padStart(2, "0")}s
                    <span className="text-muted-foreground font-normal"> remaining</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Status badge */}
          <span className={`shrink-0 px-2.5 py-1 rounded-lg border text-[11px] font-bold capitalize ${statusBadgeClass(booking.status)}`}>
            {booking.status}
          </span>
        </div>

        {/* â”€â”€ Action buttons â”€â”€ */}
        <div className="flex items-center gap-2 px-4 pb-4 flex-wrap">
          {onOpenChat && (
            <Button type="button" variant="outline" size="sm" onClick={onOpenChat}
              className="flex-1 min-w-[80px] h-8 rounded-lg text-xs font-semibold gap-1.5 border-border hover:bg-muted">
              <MessageSquare className="size-3.5" /> Chat
            </Button>
          )}
          {onStartVideoCall && (
            <Button type="button" variant="outline" size="sm" onClick={onStartVideoCall}
              className="flex-1 min-w-[80px] h-8 rounded-lg text-xs font-semibold gap-1.5 border-border hover:bg-muted">
              <Video className="size-3.5" /> Join Call
            </Button>
          )}
          {isHost && !cd.isPast && onConfirmCompletion && (
            <Button type="button" variant="outline" size="sm" onClick={onConfirmCompletion}
              className="flex-1 min-w-[140px] h-8 rounded-lg text-xs font-semibold gap-1.5 border-border text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/40">
              <CheckCircle className="size-3.5" /> Confirm Tour Completion
            </Button>
          )}
        </div>

        <div className="border-t border-border" />

        {/* â”€â”€ Guest Contact + Special Requests â”€â”€ */}
        {isHost && (
          <div className="grid grid-cols-2 gap-4 px-4 py-3 text-xs">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Guest Contact Info</p>
              {booking.guest_name && (
                <p>
                  <span className="text-muted-foreground">Name: </span>
                  <span className="font-semibold text-primary uppercase">{booking.guest_name}</span>
                </p>
              )}
              {booking.guest_email && (
                <p>
                  <span className="text-muted-foreground">Email: </span>
                  <a href={`mailto:${booking.guest_email}`} className="hover:underline text-foreground">{booking.guest_email}</a>
                </p>
              )}
              {booking.guest_phone && (
                <p>
                  <span className="text-muted-foreground">Phone: </span>
                  <a href={`tel:${booking.guest_phone}`} className="text-primary font-semibold hover:underline">{booking.guest_phone}</a>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Special Requests &amp; Notes</p>
              <p className="text-foreground/80 italic leading-relaxed">{booking.notes || "no"}</p>
            </div>
          </div>
        )}

        {timeline.length > 0 && <div className="border-t border-border" />}

        {/* â”€â”€ Status History Timeline â”€â”€ */}
        {timeline.length > 0 && (
          <div className="px-4 py-3 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status History Timeline</p>
            <div className="space-y-2">
              {timeline.map((entry, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs">
                  <span className={`size-2 rounded-full shrink-0 ${statusDotClass(entry.status)}`} />
                  <span className="font-semibold text-foreground capitalize w-20 shrink-0">{entry.status}</span>
                  <span className="text-muted-foreground text-[11px]">{fmtDateTime(entry.changed_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

