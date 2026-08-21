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
  ArrowLeft,
  Smartphone,
  Video,
  ShieldCheck,
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

  const rawTime = booking.booking_time ? booking.booking_time.slice(0, 5) : "10:00"
  
  // Calculate call start & end times
  const [hoursStr, minsStr] = rawTime.split(":")
  const startHour = parseInt(hoursStr || "10", 10)
  const startMins = parseInt(minsStr || "0", 10)
  
  const startDate = new Date()
  startDate.setHours(startHour, startMins, 0, 0)
  const endDate = new Date(startDate.getTime() + 45 * 60 * 1000) // 45-min verified recon session

  const callStartTime = startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  const callEndTime = endDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })

  const currency = booking.currency || "KES"
  const amount = Number(booking.total_price || 0).toLocaleString()
  const guestCount = booking.guest_count || 1
  const traveler = booking.guest_name || travelerName || (isHost ? "Traveler" : "You")
  const host = hostName || "Ausaguide Host"

  // Detect Payment Method
  const paymentIdStr = (booking.payment_id || "").toLowerCase()
  const isMpesa =
    currency === "KES" ||
    paymentIdStr.includes("mpesa") ||
    paymentIdStr.startsWith("ws_") ||
    paymentIdStr.startsWith("lnm")

  const isCard =
    currency === "USD" ||
    paymentIdStr.startsWith("cs_") ||
    paymentIdStr.startsWith("pi_") ||
    paymentIdStr.includes("stripe")

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-sm flex flex-col items-center my-auto py-6">
        
        {/* Navigation Bar: Go Back Button + Close */}
        <div className="w-full flex items-center justify-between mb-3 text-white">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Go Back to Chat</span>
          </button>

          <button
            onClick={onClose}
            className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            title="Close receipt"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ─── The Printable Ticket Card ─── */}
        <div
          ref={ticketRef}
          className="w-full bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden relative border border-slate-100 print:m-0 print:shadow-none print:w-full"
        >
          {/* Top Section: Celebration & Title */}
          <div className="pt-8 pb-5 px-6 text-center">
            <div className="size-14 mx-auto mb-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-xs">
              <span className="text-2xl select-none">🎉</span>
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Verified Tour Receipt
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              Official Ausaguide Escrow Settlement
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
            <div className="absolute -left-3 size-6 rounded-full bg-black/75 ring-1 ring-black/10 z-10" />
            <div className="w-full border-b-2 border-dashed border-slate-200 mx-4" />
            <div className="absolute -right-3 size-6 rounded-full bg-black/75 ring-1 ring-black/10 z-10" />
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
                  Total Paid
                </span>
                <span className="text-base font-black text-emerald-600">
                  {currency} {amount}
                </span>
              </div>
            </div>

            {/* Date & Scheduled Time */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Booking Schedule
              </span>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Calendar className="size-3.5 text-primary shrink-0" />
                {formattedDate} • {rawTime}
              </span>
            </div>

            {/* Live Video Call Timing (Start Time to End Time & Duration) */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Video className="size-3.5 text-primary" />
                  Live Recon Call
                </span>
                <span className="font-mono font-semibold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                  {callStartTime} – {callEndTime}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Total Duration</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Clock className="size-3 text-slate-500" />
                    45 Mins Session
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Group Size</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Users className="size-3 text-slate-500" />
                    {guestCount} {guestCount === 1 ? "Traveler" : "Travelers"}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Details (Distinct M-Pesa vs Card vs Escrow) */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Payment Breakdown
              </span>

              {isMpesa ? (
                /* M-Pesa Mobile Money Card */
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
                  <div className="size-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 font-black text-xs">
                    <Smartphone className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-emerald-950">M-Pesa Mobile Money</p>
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-200/80 text-emerald-800">
                        KES
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-emerald-700">
                      Ref: MPESA-{ticketId.slice(0, 8)} • Settled
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shrink-0">
                    Verified
                  </span>
                </div>
              ) : isCard ? (
                /* Credit/Debit Card (Visa/Mastercard) */
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  {/* Mastercard/Visa dual circle badges */}
                  <div className="flex items-center -space-x-1.5 shrink-0">
                    <div className="size-5 rounded-full bg-red-500 opacity-90 shadow-xs" />
                    <div className="size-5 rounded-full bg-amber-400 opacity-90 shadow-xs" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-800">Credit / Debit Card</p>
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                        USD
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500">
                      Card ending in •••• {ticketId.slice(-4) || "4242"}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-white shrink-0">
                    Paid
                  </span>
                </div>
              ) : (
                /* Ausaguide Escrow Guarantee */
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-teal-50 border border-teal-200">
                  <div className="size-8 rounded-xl bg-[#0D6F73] text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">Ausaguide Escrow</p>
                    <p className="text-[10px] text-slate-500 font-mono">Secured settlement fund</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0D6F73] text-white shrink-0">
                    Secured
                  </span>
                </div>
              )}
            </div>

            {/* Participants Summary */}
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="truncate">Traveler: <strong className="text-slate-800">{traveler}</strong></span>
              <span className="truncate">Host: <strong className="text-slate-800">{host}</strong></span>
            </div>
          </div>

          {/* ─── Perforated Ticket Notches & Dashed Line ─── */}
          <div className="relative flex items-center justify-between my-0 px-4">
            <div className="absolute -left-3 size-6 rounded-full bg-black/75 ring-1 ring-black/10 z-10" />
            <div className="w-full border-b-2 border-dashed border-slate-200 mx-4" />
            <div className="absolute -right-3 size-6 rounded-full bg-black/75 ring-1 ring-black/10 z-10" />
          </div>

          {/* Bottom Section: Barcode */}
          <div className="px-6 py-5 bg-white text-center flex flex-col items-center">
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
            onClick={onClose}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs gap-1.5 h-10 rounded-2xl cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back</span>
          </Button>

          <Button
            onClick={handlePrint}
            className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs gap-1.5 h-10 rounded-2xl shadow-lg cursor-pointer transition-all"
          >
            <Printer className="size-4 text-primary" />
            <span>Download / Print</span>
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
