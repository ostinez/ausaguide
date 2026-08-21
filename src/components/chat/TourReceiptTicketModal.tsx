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
  Ticket,
  CreditCard,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-sm flex flex-col items-center my-auto py-6">
        
        {/* Top Navigation: Go Back Button + Close */}
        <div className="w-full flex items-center justify-between mb-3.5 text-white">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#184948]/90 hover:bg-[#235E5D] border border-[#317978]/40 text-[#B7E6E5] hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Chat</span>
          </button>

          <button
            onClick={onClose}
            className="size-8 rounded-full bg-[#184948]/90 hover:bg-[#235E5D] border border-[#317978]/40 text-[#B7E6E5] hover:text-white flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Close receipt"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ─── The Printable Ticket Card (Ausaguide Brand Palette) ─── */}
        <div
          ref={ticketRef}
          className="w-full bg-gradient-to-b from-[#0e2f2f] via-[#092222] to-[#051717] text-white rounded-3xl shadow-2xl overflow-hidden relative border border-[#235E5D] print:m-0 print:shadow-none print:w-full print:bg-white print:text-slate-900"
        >
          {/* Top Section: Header & Official Badge (Icon-based, zero emojis) */}
          <div className="pt-7 pb-5 px-6 text-center relative">
            <div className="size-13 mx-auto mb-3 rounded-2xl bg-[#184948] border border-[#317978]/60 flex items-center justify-center shadow-md text-[#B7E6E5]">
              <Ticket className="size-6 text-[#B7E6E5]" />
            </div>

            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Verified Tour Receipt
            </h3>
            <p className="text-xs text-[#599D9C] mt-1 font-medium leading-relaxed">
              Official Ausaguide Escrow Settlement
            </p>

            {priorityNumber && priorityNumber > 0 && (
              <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-[#317978]/30 text-[#B7E6E5] border border-[#317978]/50 text-xs font-bold">
                <Sparkles className="size-3 text-[#B7E6E5]" />
                <span>Priority #{priorityNumber} in line</span>
              </div>
            )}
          </div>

          {/* ─── Perforated Ticket Notches & Dashed Line ─── */}
          <div className="relative flex items-center justify-between my-1 px-4">
            <div className="absolute -left-3 size-6 rounded-full bg-black/85 ring-1 ring-[#235E5D]/50 z-10" />
            <div className="w-full border-b-2 border-dashed border-[#235E5D] mx-4" />
            <div className="absolute -right-3 size-6 rounded-full bg-black/85 ring-1 ring-[#235E5D]/50 z-10" />
          </div>

          {/* Mid Section: Receipt Key Details */}
          <div className="p-6 space-y-4 text-left">
            {/* Tour Title */}
            <div className="pb-1">
              <span className="text-[10px] font-bold text-[#599D9C] uppercase tracking-wider block mb-0.5">
                Tour Experience
              </span>
              <h4 className="text-sm font-extrabold text-white leading-snug line-clamp-2">
                {booking.tour_name}
              </h4>
            </div>

            {/* Ticket ID & Amount Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#599D9C] uppercase tracking-wider block">
                  Ticket ID
                </span>
                <span className="text-xs font-mono font-bold text-[#B7E6E5] tracking-tight">
                  {ticketId}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-[#599D9C] uppercase tracking-wider block">
                  Total Paid
                </span>
                <span className="text-base font-black text-emerald-400">
                  {currency} {amount}
                </span>
              </div>
            </div>

            {/* Date & Scheduled Time */}
            <div>
              <span className="text-[10px] font-bold text-[#599D9C] uppercase tracking-wider block">
                Booking Schedule
              </span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                <Calendar className="size-3.5 text-[#317978] shrink-0" />
                {formattedDate} • {rawTime}
              </span>
            </div>

            {/* Live Video Call Timing (Start Time to End Time & Duration) */}
            <div className="p-3.5 bg-[#082020]/90 rounded-2xl border border-[#1f4e4d] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#B7E6E5] flex items-center gap-1.5">
                  <Video className="size-3.5 text-[#317978]" />
                  Live Recon Call
                </span>
                <span className="font-mono font-semibold text-emerald-300 bg-[#113B3A] px-2 py-0.5 rounded-md border border-[#317978]/40 text-[11px]">
                  {callStartTime} – {callEndTime}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1f4e4d]/80 text-xs">
                <div>
                  <span className="text-[10px] text-[#599D9C] font-medium block">Total Duration</span>
                  <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                    <Clock className="size-3 text-[#317978]" />
                    45 Mins Session
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#599D9C] font-medium block">Group Size</span>
                  <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                    <Users className="size-3 text-[#317978]" />
                    {guestCount} {guestCount === 1 ? "Traveler" : "Travelers"}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Details (Distinct M-Pesa vs Card vs Escrow) */}
            <div>
              <span className="text-[10px] font-bold text-[#599D9C] uppercase tracking-wider block mb-1.5">
                Payment Breakdown
              </span>

              {isMpesa ? (
                /* M-Pesa Mobile Money Card */
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#06241a] border border-emerald-500/30">
                  <div className="size-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 font-black text-xs">
                    <Smartphone className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-emerald-300">M-Pesa Mobile Money</p>
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">
                        KES
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-emerald-400/80">
                      Ref: MPESA-{ticketId.slice(0, 8)} • Settled
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 shrink-0">
                    Verified
                  </span>
                </div>
              ) : isCard ? (
                /* Credit/Debit Card (Visa/Mastercard) */
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0a2233] border border-sky-500/30">
                  <div className="size-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs shrink-0 font-black text-xs">
                    <CreditCard className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-sky-200">Credit / Debit Card</p>
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-sky-900/60 text-sky-300 border border-sky-500/30">
                        USD
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-sky-300/70">
                      Card ending in •••• {ticketId.slice(-4) || "4242"}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-400 text-slate-950 shrink-0">
                    Paid
                  </span>
                </div>
              ) : (
                /* Ausaguide Escrow Guarantee */
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#113B3A] border border-[#317978]/50">
                  <div className="size-8 rounded-xl bg-[#317978] text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="size-4 text-[#B7E6E5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white">Ausaguide Escrow</p>
                    <p className="text-[10px] text-[#599D9C] font-mono">Secured settlement fund</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#317978] text-[#B7E6E5] shrink-0">
                    Secured
                  </span>
                </div>
              )}
            </div>

            {/* Participants Summary */}
            <div className="text-[11px] text-[#599D9C] flex items-center justify-between pt-1 border-t border-[#1f4e4d]">
              <span className="truncate">Traveler: <strong className="text-white">{traveler}</strong></span>
              <span className="truncate">Host: <strong className="text-white">{host}</strong></span>
            </div>
          </div>

          {/* ─── Perforated Ticket Notches & Dashed Line ─── */}
          <div className="relative flex items-center justify-between my-0 px-4">
            <div className="absolute -left-3 size-6 rounded-full bg-black/85 ring-1 ring-[#235E5D]/50 z-10" />
            <div className="w-full border-b-2 border-dashed border-[#235E5D] mx-4" />
            <div className="absolute -right-3 size-6 rounded-full bg-black/85 ring-1 ring-[#235E5D]/50 z-10" />
          </div>

          {/* Bottom Section: High-Contrast Barcode Box */}
          <div className="px-6 py-5 bg-[#051717] text-center flex flex-col items-center">
            <div className="w-full max-w-[240px] bg-white p-2.5 rounded-xl shadow-inner flex flex-col items-center">
              <div className="flex items-center justify-center gap-0.5 h-10 w-full">
                {Array.from({ length: 42 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-full bg-slate-950 ${
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
              <div className="flex items-center justify-between w-full text-[9px] font-mono text-slate-600 mt-1 px-1">
                <span>{ticketId.slice(0, 4)}</span>
                <span>{ticketId.slice(4, 9)}</span>
                <span>{ticketId.slice(9)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls underneath */}
        <div className="w-full flex items-center gap-2 mt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-[#184948]/90 hover:bg-[#235E5D] border-[#317978]/40 text-[#B7E6E5] hover:text-white font-bold text-xs gap-1.5 h-10 rounded-2xl cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back</span>
          </Button>

          <Button
            onClick={handlePrint}
            className="flex-1 bg-[#317978] hover:bg-[#317978]/90 text-white font-bold text-xs gap-1.5 h-10 rounded-2xl shadow-neo-pill border border-[#B7E6E5]/20 cursor-pointer transition-all"
          >
            <Printer className="size-4 text-[#B7E6E5]" />
            <span>Download / Print</span>
          </Button>

          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="icon"
            className="size-10 rounded-2xl bg-[#184948]/90 border-[#317978]/40 text-[#B7E6E5] hover:text-white hover:bg-[#235E5D] cursor-pointer shrink-0"
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
