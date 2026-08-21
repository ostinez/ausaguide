import { useState, useRef } from "react"
import {
  X,
  Printer,
  Calendar,
  Clock,
  Users,
  Sparkles,
  Share2,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { type TourBookingInfo } from "./HostTourBookingDetails"
import { toast } from "sonner"

interface TourReceiptTicketModalProps {
  isOpen: boolean
  onClose: () => void
  booking: TourBookingInfo | null
  hostName?: string
  travelerName?: string
  priorityNumber?: number
  isHost?: boolean
}

export function TourReceiptTicketModal({
  isOpen,
  onClose,
  booking,
  hostName,
  travelerName,
  priorityNumber,
  isHost = false,
}: TourReceiptTicketModalProps) {
  const [copied, setCopied] = useState(false)
  const ticketRef = useRef<HTMLDivElement>(null)

  if (!isOpen || !booking) return null

  const ticketId = (booking.payment_id || booking.id || "0120034399434")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 13)
    .toUpperCase()

  const formattedDate = booking.booking_date
    ? new Date(booking.booking_date).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Flexible Date"

  const formattedTime = booking.booking_time
    ? booking.booking_time.slice(0, 5)
    : "10:00 AM"

  const currency = booking.currency || "KES"
  const amount = Number(booking.total_price || 0).toLocaleString()
  const guestCount = booking.guest_count || 1
  const duration = "2.5 Hours" // Standard tour experience duration
  const traveler = booking.guest_name || travelerName || (isHost ? "Traveler" : "You")
  const host = hostName || "Ausaguide Host"

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/messages?booking_id=${booking.id}`
    )
    setCopied(true)
    toast.success("Receipt link copied to clipboard!")
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm flex flex-col items-center">
        {/* Close Button at top right */}
        <button
          onClick={onClose}
          className="absolute -top-11 right-0 size-9 rounded-full bg-white/15 text-white hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
          title="Close receipt"
        >
          <X className="size-5" />
        </button>

        {/* ─── The Printable Ticket Card ─── */}
        <div
          ref={ticketRef}
          className="w-full bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden relative border border-slate-100 print:m-0 print:shadow-none print:w-full"
        >
          {/* Top Section: Celebration & Title */}
          <div className="pt-8 pb-5 px-6 text-center">
            {/* Party popper icon with celebratory aura */}
            <div className="size-14 mx-auto mb-3 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-xs">
              <span className="text-2xl select-none">🎉</span>
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Thank you!
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              Your ticket has been issued successfully
            </p>

            {priorityNumber && priorityNumber > 0 && (
              <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
                <Sparkles className="size-3 text-emerald-600" />
                <span>Priority #{priorityNumber} in line</span>
              </div>
            )}
          </div>

          {/* ─── Perforated Ticket Notches & Dashed Line ─── */}
          <div className="relative flex items-center justify-between my-1 px-4">
            {/* Left Notch cutout */}
            <div className="absolute -left-3 size-6 rounded-full bg-black/70 ring-1 ring-black/10 z-10" />
            {/* Dashed Line */}
            <div className="w-full border-b-2 border-dashed border-slate-200 mx-4" />
            {/* Right Notch cutout */}
            <div className="absolute -right-3 size-6 rounded-full bg-black/70 ring-1 ring-black/10 z-10" />
          </div>

          {/* Mid Section: Receipt Key Details */}
          <div className="p-6 space-y-4 text-left">
            {/* Tour Title */}
            <div className="pb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Tour Experience
              </span>
              <h4 className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-2">
                {booking.tour_name}
              </h4>
            </div>

            {/* Ticket ID & Amount Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ticket ID
                </span>
                <span className="text-xs font-mono font-bold text-slate-800 tracking-tight">
                  {ticketId}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Amount
                </span>
                <span className="text-base font-black text-emerald-600">
                  {currency} {amount}
                </span>
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Date &amp; Time
              </span>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Calendar className="size-3.5 text-primary shrink-0" />
                {formattedDate} • {formattedTime}
              </span>
            </div>

            {/* Duration & People Count (How long & How many people) */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Clock className="size-3 text-slate-500" />
                  Duration
                </span>
                <span className="text-xs font-black text-slate-800 block">
                  {duration}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Users className="size-3 text-slate-500" />
                  People
                </span>
                <span className="text-xs font-black text-slate-800 block">
                  {guestCount} {guestCount === 1 ? "Traveler" : "Travelers"}
                </span>
              </div>
            </div>

            {/* Traveler / Payment Pill with Card Graphic */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              {/* Mastercard/Visa Style Circle Badges */}
              <div className="flex items-center -space-x-1.5 shrink-0">
                <div className="size-5 rounded-full bg-red-500 opacity-90 shadow-xs" />
                <div className="size-5 rounded-full bg-amber-400 opacity-90 shadow-xs" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {traveler} • Host: {host}
                </p>
                <p className="text-[10px] font-mono text-slate-400">
                  •••• {ticketId.slice(-4) || "8237"} • Verified Escrow
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {booking.status === "completed" ? "Completed" : "Paid & Active"}
              </span>
            </div>
          </div>

          {/* ─── Perforated Ticket Notches & Dashed Line ─── */}
          <div className="relative flex items-center justify-between my-0 px-4">
            <div className="absolute -left-3 size-6 rounded-full bg-black/70 ring-1 ring-black/10 z-10" />
            <div className="w-full border-b-2 border-dashed border-slate-200 mx-4" />
            <div className="absolute -right-3 size-6 rounded-full bg-black/70 ring-1 ring-black/10 z-10" />
          </div>

          {/* Bottom Section: Barcode / QR */}
          <div className="px-6 py-5 bg-white text-center flex flex-col items-center">
            {/* Authentic Barcode Graphic */}
            <div className="flex items-center justify-center gap-0.5 h-12 w-full max-w-[240px] px-2 py-1 bg-white">
              {Array.from({ length: 42 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-full bg-slate-900 ${
                    i % 5 === 0
                      ? "w-1.5"
                      : i % 3 === 0
                      ? "w-1"
                      : i % 2 === 0
                      ? "w-0.5"
                      : "w-[1px]"
                  } ${i % 7 === 0 ? "opacity-90" : "opacity-100"}`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between w-full max-w-[240px] text-[10px] font-mono text-slate-400 mt-1.5 px-2">
              <span>{ticketId.slice(0, 4)}</span>
              <span>{ticketId.slice(4, 9)}</span>
              <span>{ticketId.slice(9)}</span>
            </div>
          </div>
        </div>

        {/* Action Controls underneath */}
        <div className="w-full flex items-center gap-2 mt-4">
          <Button
            onClick={handlePrint}
            className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs gap-1.5 h-10 rounded-2xl shadow-lg cursor-pointer transition-all"
          >
            <Printer className="size-4 text-primary" />
            <span>Download / Print Receipt</span>
          </Button>

          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="icon"
            className="size-10 rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20 cursor-pointer shrink-0"
            title="Share receipt link"
          >
            {copied ? <Check className="size-4 text-emerald-400" /> : <Share2 className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TourReceiptTicketModal
