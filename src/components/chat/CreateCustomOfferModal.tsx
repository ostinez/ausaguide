import { useState } from "react"
import { Tag, X, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface CreateCustomOfferModalProps {
  isOpen: boolean
  onClose: () => void
  conversationId: string
  hostId: string
  travelerId: string
  hostName?: string
  travelerName?: string
  onOfferCreated?: () => void
}

export default function CreateCustomOfferModal({
  isOpen,
  onClose,
  conversationId,
  hostId,
  travelerId,
  hostName,
  travelerName,
  onOfferCreated,
}: CreateCustomOfferModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState("KES")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("10:00 AM")
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Please enter an offer title.")
      return
    }

    const numPrice = Number(price)
    if (isNaN(numPrice) || numPrice <= 0) {
      toast.error("Please enter a valid price.")
      return
    }

    if (!date) {
      toast.error("Please pick a date for the experience.")
      return
    }

    setSubmitting(true)
    const toastId = toast.loading("Sending custom offer...")

    try {
      // 1. Calculate expiration 24 hours from now
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      // 2. Insert custom booking into bookings table
      const { data: bookingData, error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          tour_id: "00000000-0000-0000-0000-000000000000", // Placeholder or custom tour uuid
          guest_id: travelerId,
          host_id: hostId,
          booking_date: date,
          booking_time: time,
          guest_count: 1,
          total_price: numPrice,
          currency: currency,
          status: "pending",
          is_custom: true,
          custom_details: {
            title: title.trim(),
            description: description.trim(),
            time: time,
            date: date,
            created_by: hostId,
          },
          offer_expires_at: expiresAt,
          guest_name: travelerName || "Traveler",
          guest_email: "traveler@ausaguide.com",
          guest_phone: "N/A",
        })
        .select("id")
        .maybeSingle()

      if (bookingErr) {
        console.warn("Could not pre-insert custom booking:", bookingErr)
      }

      const createdBookingId = bookingData?.id

      // 3. Insert custom_offer message in conversation
      const { error: msgErr } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: hostId,
        receiver_id: travelerId,
        booking_id: createdBookingId || null,
        message: `🏷️ Custom Tour Offer: ${title.trim()} (${currency} ${numPrice.toLocaleString()})`,
        read: false,
        sender_type: "host",
        notification_type: "custom_offer",
        metadata: {
          type: "custom_offer",
          booking_id: createdBookingId,
          title: title.trim(),
          description: description.trim(),
          price: numPrice,
          currency: currency,
          date: date,
          time: time,
          offer_expires_at: expiresAt,
          status: "pending",
          host_id: hostId,
          traveler_id: travelerId,
          host_name: hostName,
          traveler_name: travelerName,
        },
      })

      if (msgErr) throw msgErr

      toast.dismiss(toastId)
      toast.success("Custom offer sent directly to traveler!")
      onOfferCreated?.()
      onClose()
    } catch (err: any) {
      console.error("Error creating custom offer:", err)
      toast.dismiss(toastId)
      toast.error(err.message || "Failed to create custom offer.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div
        className="relative w-full max-w-md rounded-2xl bg-[#141416] border border-border/60 shadow-2xl p-5 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Tag className="size-4" />
            </span>
            <div>
              <h3 className="font-bold text-foreground text-sm">Create Custom Offer</h3>
              <p className="text-[11px] text-muted-foreground">
                Sent to {travelerName || "traveler"} with a 24-hour pay window.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-4 text-left">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase">
              Offer Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Private Sunset Dhow + Seafood Dinner"
              required
              className="text-xs bg-muted/40 border-border/60 h-9 rounded-xl focus-visible:ring-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase">
              Description & Inclusions
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what's included: transport, equipment, duration, meeting point..."
              rows={3}
              className="w-full text-xs bg-muted/40 rounded-xl px-3 py-2 text-foreground focus:outline-none border border-border/60 min-h-[70px] resize-y leading-relaxed"
            />
          </div>

          {/* Price & Currency */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">
                Total Price *
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 4500"
                  required
                  className="text-xs bg-muted/40 border-border/60 h-9 rounded-xl pr-3 pl-3 focus-visible:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-9 rounded-xl border border-border/60 bg-muted/40 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
              >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">
                Date *
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
                className="text-xs bg-muted/40 border-border/60 h-9 rounded-xl focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">
                Time
              </label>
              <Input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 02:00 PM"
                className="text-xs bg-muted/40 border-border/60 h-9 rounded-xl focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Notice */}
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-muted-foreground flex items-center gap-2">
            <Sparkles className="size-4 text-primary shrink-0" />
            <span>The traveler will be able to review the offer and checkout instantly via M-Pesa.</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4"
            >
              {submitting ? (
                <Loader2 className="size-3.5 animate-spin mr-1" />
              ) : (
                <Tag className="size-3.5 mr-1" />
              )}
              Send Custom Offer
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
