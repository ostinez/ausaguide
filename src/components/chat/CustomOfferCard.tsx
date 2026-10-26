import { useState, useEffect } from "react"
import { Tag, Calendar, Clock, CheckCircle2, AlertCircle, CreditCard, ChevronRight, Sparkles, Receipt, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MPesaCheckout } from "@/components/Checkout/MPesaCheckout"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export interface CustomOfferDetails {
  booking_id?: string
  title: string
  description?: string
  price: number
  currency?: string
  date?: string
  time?: string
  offer_expires_at?: string
  status?: "pending" | "paid" | "confirmed" | "declined" | "expired" | string
  host_id?: string
  traveler_id?: string
  host_name?: string
  traveler_name?: string
}

interface CustomOfferCardProps {
  messageId: string
  conversationId: string
  details: CustomOfferDetails
  currentUserId: string
  currentUserRole?: string
  onStatusChange?: () => void
}

export default function CustomOfferCard({
  messageId,
  conversationId,
  details,
  currentUserId,
  currentUserRole,
  onStatusChange,
}: CustomOfferCardProps) {
  const [showCheckout, setShowCheckout] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [userPhone, setUserPhone] = useState("")
  const [status, setStatus] = useState(details.status || "pending")
  const [timeLeftStr, setTimeLeftStr] = useState("")
  const [isExpired, setIsExpired] = useState(false)

  const isHost = currentUserId === details.host_id || currentUserRole === "host"
  const isTraveler = !isHost

  // Expiration calculation
  useEffect(() => {
    const expiresAt = details.offer_expires_at
    if (!expiresAt) return

    function checkExpiry() {
      const diffMs = new Date(String(expiresAt)).getTime() - Date.now()
      if (diffMs <= 0) {
        setIsExpired(true)
        setTimeLeftStr("Expired")
      } else {
        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeftStr(`${hours}h ${mins}m left`)
      }
    }

    checkExpiry()
    const timer = setInterval(checkExpiry, 60000)
    return () => clearInterval(timer)
  }, [details.offer_expires_at])

  // Fetch traveler email/phone for M-Pesa checkout
  useEffect(() => {
    if (isTraveler && currentUserId) {
      supabase
        .from("profiles")
        .select("email, phone")
        .eq("id", currentUserId)
        .single()
        .then(({ data }) => {
          if (data) {
            setUserEmail(data.email || "")
            setUserPhone(data.phone || "")
          }
        })
    }
  }, [isTraveler, currentUserId])

  // Handle successful payment
  const handlePaymentSuccess = async (paymentId: string) => {
    const toastId = toast.loading("Finalizing your custom tour booking...")
    try {
      setStatus("paid")

      // 1. Update booking in bookings table
      if (details.booking_id) {
        await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            payment_status: "paid",
            payment_id: paymentId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", details.booking_id)
      }

      // 2. Update message metadata to mark offer as paid
      await supabase
        .from("messages")
        .update({
          metadata: {
            ...details,
            status: "paid",
            payment_id: paymentId,
            paid_at: new Date().toISOString(),
          },
        })
        .eq("id", messageId)

      // 3. Insert confirmed system message into conversation
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        receiver_id: details.host_id,
        booking_id: details.booking_id || null,
        message: `🎟️ Custom offer for "${details.title}" was PAID and CONFIRMED via M-Pesa!`,
        read: false,
        sender_type: "system",
        notification_type: "booking_confirmed",
        metadata: {
          type: "booking_confirmed",
          booking_id: details.booking_id,
          tour_name: details.title,
          amount: details.price,
          currency: details.currency || "KES",
          date: details.date,
          time: details.time,
        },
      })

      toast.dismiss(toastId)
      toast.success("Payment received! Tour booking confirmed.")
      setShowCheckout(false)
      onStatusChange?.()
    } catch (err: any) {
      console.error("Failed to complete custom offer booking:", err)
      toast.dismiss(toastId)
      toast.error(err.message || "Failed to confirm booking after payment.")
    }
  }

  const isConfirmed = status === "paid" || status === "confirmed"

  return (
    <div className="w-full max-w-md mx-auto my-3">
      {/* ── Ticket / Invoice Card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-b from-card via-card to-card/90 shadow-2xl transition-all">
        {/* Top Header Strip */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary/15 border-b border-primary/20">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-primary/20 text-primary">
              <Tag className="size-4 text-primary" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Custom Tour Offer
            </span>
          </div>

          {/* Expiration badge */}
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="size-3" />
              <span>Confirmed</span>
            </span>
          ) : isExpired ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
              <AlertCircle className="size-3" />
              <span>Expired</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              <Clock className="size-3" />
              <span>{timeLeftStr || "24h window"}</span>
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3.5 text-left">
          {/* Title & Price Row */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-bold text-foreground text-base leading-tight">
                {details.title}
              </h4>
              {details.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                  {details.description}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-muted-foreground uppercase block">
                Total
              </span>
              <span className="text-lg font-black text-primary">
                {details.currency || "KES"} {Number(details.price || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/40 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="size-3.5 text-primary shrink-0" />
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">Date</span>
                <span className="font-semibold text-foreground truncate block">
                  {details.date ? new Date(details.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Flexible"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-primary shrink-0" />
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">Time</span>
                <span className="font-semibold text-foreground truncate block">
                  {details.time || "Agreed Time"}
                </span>
              </div>
            </div>
          </div>

          {/* Action / Status Footer */}
          <div className="pt-2 border-t border-border/30">
            {isConfirmed ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <Receipt className="size-4" />
                  <span>Ticket Verified & Booking Active</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  Paid
                </span>
              </div>
            ) : isExpired ? (
              <p className="text-xs text-muted-foreground text-center italic">
                This custom offer has expired. Ask the host to issue a new offer if needed.
              </p>
            ) : isTraveler ? (
              <Button
                onClick={() => setShowCheckout(true)}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs gap-2 shadow-lg shadow-emerald-500/20 h-10 cursor-pointer"
              >
                <CreditCard className="size-4" />
                <span>Pay Now with M-Pesa ({details.currency || "KES"} {Number(details.price).toLocaleString()})</span>
                <ChevronRight className="size-4 ml-auto" />
              </Button>
            ) : (
              <div className="flex items-center justify-between text-xs text-muted-foreground p-2 rounded-xl bg-muted/30">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Offer sent to traveler</span>
                </span>
                <span className="font-bold text-amber-400">Awaiting Payment</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── M-Pesa Checkout Modal for Custom Offer ── */}
      {showCheckout && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#141416] border border-border/60 shadow-2xl p-5 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-4">
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-primary" />
                <h3 className="font-bold text-foreground text-sm">Checkout Custom Tour Offer</h3>
              </div>
              <button
                onClick={() => setShowCheckout(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <MPesaCheckout
              bookingId={details.booking_id || messageId}
              amount={Number(details.price)}
              currency={details.currency || "KES"}
              email={userEmail}
              prefillPhone={userPhone}
              bookingSummary={{
                tourTitle: details.title,
                bookingDate: details.date || new Date().toISOString(),
                guestCount: 1,
                totalPrice: Number(details.price),
                currency: details.currency || "KES",
              }}
              onSuccess={(paymentId) => handlePaymentSuccess(paymentId)}
              onError={(err) => toast.error(err || "Payment could not be completed.")}
            />
          </div>
        </div>
      )}
    </div>
  )
}
