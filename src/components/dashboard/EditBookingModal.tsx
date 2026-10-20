import { useState, useEffect } from "react"
import {
  X,
  Video,
  MapPin,
  Calendar,
  Smartphone,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { supabase } from "@/lib/supabase"
import type { Booking } from "@/lib/types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface EditBookingModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking
  onSuccess: () => void
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("254") && digits.length === 12) return digits
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1)
  if (digits.length === 9) return "254" + digits
  return digits
}

export function EditBookingModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: EditBookingModalProps) {
  const tour = booking.tour
  const initialType =
    (booking.booking_type as "physical" | "virtual") ||
    (tour?.tour_type === "virtual" ? "virtual" : "physical")

  const [guestCount, setGuestCount] = useState<number>(booking.guest_count || 1)
  const [tourType, setTourType] = useState<"physical" | "virtual">(initialType)
  const [phone, setPhone] = useState<string>(booking.guest_phone || "")
  const [loading, setLoading] = useState(false)
  const [stkPending, setStkPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setGuestCount(booking.guest_count || 1)
      setTourType(
        (booking.booking_type as "physical" | "virtual") ||
          (tour?.tour_type === "virtual" ? "virtual" : "physical")
      )
      setPhone(booking.guest_phone || "")
      setErrorMessage(null)
      setStkPending(false)
    }
  }, [isOpen, booking, tour])

  if (!isOpen) return null

  // Pricing calculations
  const originalPrice = Number(booking.total_price || 0)

  // Compute unit price based on selected tour type
  const physicalUnitPrice =
    tour?.physical_price ??
    tour?.price ??
    (originalPrice > 0 && (booking.guest_count || 1) > 0
      ? Math.round(originalPrice / (booking.guest_count || 1))
      : 3000)

  const virtualUnitPrice =
    tour?.virtual_price ??
    (tour?.price ? Math.round(tour.price * 0.6) : Math.round(physicalUnitPrice * 0.6))

  const selectedUnitPrice = tourType === "virtual" ? virtualUnitPrice : physicalUnitPrice
  const newTotalPrice = Math.round(selectedUnitPrice * guestCount)
  const priceDifference = newTotalPrice - originalPrice

  const maxGuests = tour?.max_guests || 10

  async function handleSave() {
    setLoading(true)
    setErrorMessage(null)

    try {
      // CASE 1: Price difference > 0 (Upgrade or extra guests -> Trigger M-Pesa STK Push)
      if (priceDifference > 0) {
        const formattedPhone = normalizePhone(phone)
        if (!/^254[17]\d{8}$/.test(formattedPhone)) {
          setErrorMessage("Please enter a valid Kenyan Safaricom phone number (e.g. 0712345678 or 254712345678).")
          setLoading(false)
          return
        }

        setStkPending(true)
        toast.info(`Sending M-Pesa prompt for KES ${priceDifference.toLocaleString()} to ${formattedPhone}...`)

        // Invoke mpesa-stk-push edge function for the difference
        const { data: stkRes, error: stkError } = await supabase.functions.invoke(
          "mpesa-stk-push",
          {
            body: {
              phone: formattedPhone,
              amount: priceDifference,
              reference: booking.id,
            },
          }
        )

        if (stkError) {
          throw new Error(stkError.message || "Failed to trigger M-Pesa topup prompt.")
        }

        if (stkRes?.ResponseCode && stkRes.ResponseCode !== "0") {
          throw new Error(stkRes.ResponseDescription || "Safaricom could not process this topup request.")
        }

        // Update booking details with new price and payment_status = 'paid' for topup
        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            guest_count: guestCount,
            booking_type: tourType,
            total_price: newTotalPrice,
            guest_phone: formattedPhone,
            payment_status: "paid",
            payment_reference: stkRes?.CheckoutRequestID || booking.stripe_payment_intent_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", booking.id)

        if (updateError) {
          throw updateError
        }

        toast.success(`Booking updated! STK Push sent for KES ${priceDifference.toLocaleString()}. Check your phone.`)
        onSuccess()
        onClose()
      } else {
        // CASE 2 & 3: Price difference <= 0 (Downgrade or unchanged)
        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            guest_count: guestCount,
            booking_type: tourType,
            total_price: newTotalPrice,
            updated_at: new Date().toISOString(),
          })
          .eq("id", booking.id)

        if (updateError) {
          throw updateError
        }

        if (priceDifference < 0) {
          toast.success(
            `Booking updated! A refund difference of KES ${Math.abs(
              priceDifference
            ).toLocaleString()} will be handled manually by our team.`
          )
        } else {
          toast.success("Booking details successfully updated!")
        }

        onSuccess()
        onClose()
      }
    } catch (err: any) {
      console.error("[EditBookingModal] Save failed:", err)
      setErrorMessage(err.message || "Failed to modify booking. Please try again.")
    } finally {
      setLoading(false)
      setStkPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Edit Booking</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tour?.title || "Upcoming Experience"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tour Metadata */}
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <Calendar className="size-3.5 text-primary" />
            {booking.booking_date} {booking.booking_time ? `at ${booking.booking_time}` : ""}
          </span>
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <MapPin className="size-3.5 text-teal" />
            {tour?.location_name || "Kenya"}
          </span>
          <span className="ml-auto font-bold text-foreground">
            Current: KES {originalPrice.toLocaleString()}
          </span>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Modification Form */}
        <div className="mt-5 space-y-5">
          {/* Tour Type Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Experience Type
            </Label>
            <RadioGroup
              value={tourType}
              onValueChange={(val) => setTourType(val as "physical" | "virtual")}
              className="grid grid-cols-2 gap-3"
            >
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all",
                  tourType === "physical"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <RadioGroupItem value="physical" id="type-physical" />
                  <div>
                    <p className="text-xs font-bold text-foreground">In-Person</p>
                    <p className="text-[11px] text-muted-foreground">
                      KES {physicalUnitPrice.toLocaleString()}/person
                    </p>
                  </div>
                </div>
                <MapPin className="size-4 text-primary" />
              </label>

              <label
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all",
                  tourType === "virtual"
                    ? "border-teal bg-teal/5 ring-1 ring-teal"
                    : "border-border hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <RadioGroupItem value="virtual" id="type-virtual" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Virtual Live</p>
                    <p className="text-[11px] text-muted-foreground">
                      KES {virtualUnitPrice.toLocaleString()}/person
                    </p>
                  </div>
                </div>
                <Video className="size-4 text-teal" />
              </label>
            </RadioGroup>
          </div>

          {/* Guest Count Stepper */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Number of Guests (Max: {maxGuests})
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 rounded-lg"
                disabled={guestCount <= 1 || loading}
                onClick={() => setGuestCount((prev) => Math.max(1, prev - 1))}
              >
                -
              </Button>
              <div className="flex-1 text-center font-bold text-sm text-foreground">
                {guestCount} {guestCount === 1 ? "Guest" : "Guests"}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 rounded-lg"
                disabled={guestCount >= maxGuests || loading}
                onClick={() => setGuestCount((prev) => Math.min(maxGuests, prev + 1))}
              >
                +
              </Button>
            </div>
          </div>

          {/* Price Recalculation Summary Box */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Recalculated Price:</span>
              <span className="font-semibold text-foreground">
                KES {selectedUnitPrice.toLocaleString()} × {guestCount} = KES{" "}
                {newTotalPrice.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2">
              <span>Original Amount Paid:</span>
              <span className="font-semibold text-foreground">
                KES {originalPrice.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm font-bold border-t border-border/60 pt-2">
              <span>Adjustment Difference:</span>
              {priceDifference > 0 ? (
                <span className="text-amber-500 font-extrabold">
                  + KES {priceDifference.toLocaleString()} (Topup Required)
                </span>
              ) : priceDifference < 0 ? (
                <span className="text-emerald-500 font-extrabold">
                  - KES {Math.abs(priceDifference).toLocaleString()} (Refund Due)
                </span>
              ) : (
                <span className="text-muted-foreground">No Price Difference</span>
              )}
            </div>

            {priceDifference < 0 && (
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                Note: The difference of KES {Math.abs(priceDifference).toLocaleString()} will be refunded manually by Ausaguide support.
              </p>
            )}
          </div>

          {/* Phone number input if topup required */}
          {priceDifference > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Smartphone className="size-3.5 text-primary" />
                M-Pesa Phone Number for Topup (KES {priceDifference.toLocaleString()})
              </Label>
              <Input
                type="tel"
                placeholder="0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="h-10 text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                An M-Pesa STK Prompt will appear on your phone to approve the difference.
              </p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border/60 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="rounded-full text-xs font-semibold"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="rounded-full gap-2 text-xs font-bold px-5"
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {stkPending ? "Sending STK Push…" : "Updating…"}
              </>
            ) : priceDifference > 0 ? (
              <>
                Pay KES {priceDifference.toLocaleString()} Topup
                <ArrowRight className="size-3.5" />
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default EditBookingModal
