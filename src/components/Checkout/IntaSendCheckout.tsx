import { useState } from "react"
import { ShieldCheck, Smartphone, CreditCard, Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface IntaSendCheckoutProps {
  amount: number
  currency?: string
  email: string
  phone: string
  bookingId: string
  onSuccess?: (paymentId: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

export function IntaSendCheckout({
  amount,
  currency = "KES",
  email,
  phone: initialPhone,
  bookingId,
  onSuccess,
  onError,
  disabled = false,
  className = "",
}: IntaSendCheckoutProps) {
  const [phone, setPhone] = useState(initialPhone || "")
  const [payMethod, setPayMethod] = useState<"stk" | "card">("stk")
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  async function handleIntaSendPay() {
    if (!email) {
      const msg = "Email address is required for payment"
      setError(msg)
      onError?.(msg)
      return
    }

    if (payMethod === "stk" && !phone) {
      const msg = "M-PESA phone number is required for STK Push"
      setError(msg)
      onError?.(msg)
      return
    }

    setLoading(true)
    setError(null)
    setStatusMessage(payMethod === "stk" ? "Sending M-PESA STK Push prompt to your phone..." : "Initializing IntaSend Checkout...")

    try {
      // Invoke inta-pay-init edge function
      const { data, error: functionErr } = await supabase.functions.invoke("inta-pay-init", {
        body: {
          amount,
          currency,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          bookingId,
          method: payMethod === "stk" ? "STK_PUSH" : "CHECKOUT_URL",
        },
      })

      if (functionErr) {
        let errorMsg = "Failed to initialize IntaSend payment"
        if (functionErr instanceof Error) {
          errorMsg = functionErr.message
        }
        throw new Error(errorMsg)
      }

      if (!data || data.error) {
        throw new Error(data?.error || "IntaSend initialization returned an error")
      }

      if (payMethod === "card" && data.checkout_url) {
        // Redirect to IntaSend hosted checkout page
        window.location.href = data.checkout_url
        return
      }

      // For STK Push, poll verification status
      setStatusMessage("STK Push prompt sent! Please enter your M-PESA PIN on your mobile device to complete payment.")
      
      const paymentId = data.payment_id

      let retries = 0
      const maxRetries = 10
      const pollInterval = setInterval(async () => {
        retries++
        try {
          const { data: verifyData } = await supabase.functions.invoke("inta-pay-verify", {
            body: { payment_id: paymentId, booking_id: bookingId },
          })

          if (verifyData?.verified || verifyData?.payment_status === "paid") {
            clearInterval(pollInterval)
            setLoading(false)
            setPaymentSuccess(true)
            setStatusMessage("Payment confirmed! Redirecting...")
            onSuccess?.(paymentId)
            setTimeout(() => {
              window.location.href = `/payment-success?booking_id=${bookingId}`
            }, 1200)
          } else if (retries >= maxRetries) {
            clearInterval(pollInterval)
            setLoading(false)
            // Even if polling timeouts, allow user to proceed to verification page
            onSuccess?.(paymentId)
            window.location.href = `/payment-success?booking_id=${bookingId}`
          }
        } catch (e) {
          console.warn("Poll verify error:", e)
        }
      }, 4000)
    } catch (err: any) {
      console.error("IntaSend Checkout Error:", err)
      const errorMsg = err?.message || "Payment processing failed"
      setError(errorMsg)
      onError?.(errorMsg)
      setLoading(false)
    }
  }

  return (
    <div className={cn("space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm", className)}>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">IntaSend Secure Payment</h3>
            <p className="text-xs text-muted-foreground">M-PESA & Card Gateway (Tier 2 Verified)</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">Total Amount</span>
          <p className="text-lg font-bold text-foreground">{currency} {amount.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment Method Selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setPayMethod("stk")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all",
            payMethod === "stk"
              ? "border-primary bg-primary/5 text-primary shadow-sm"
              : "border-border bg-background/50 text-muted-foreground hover:bg-muted/50"
          )}
        >
          <Smartphone className="size-5" />
          <span className="text-xs font-semibold">M-PESA Express</span>
        </button>

        <button
          type="button"
          onClick={() => setPayMethod("card")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all",
            payMethod === "card"
              ? "border-primary bg-primary/5 text-primary shadow-sm"
              : "border-border bg-background/50 text-muted-foreground hover:bg-muted/50"
          )}
        >
          <CreditCard className="size-5" />
          <span className="text-xs font-semibold">Card / Checkout Link</span>
        </button>
      </div>

      {/* M-PESA Input Field */}
      {payMethod === "stk" && (
        <div className="space-y-1.5">
          <Label htmlFor="mpesa-phone" className="text-xs">M-PESA Registered Phone Number</Label>
          <Input
            id="mpesa-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0712345678 or 254712345678"
            className="h-10 text-sm"
          />
          <p className="text-[11px] text-muted-foreground">
            Enter phone number to receive instant M-PESA STK Push prompt on your device.
          </p>
        </div>
      )}

      {/* Status & Error Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {statusMessage && !error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
          <Spinner className="size-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {paymentSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-xs text-green-500 font-medium">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Payment successful! Updating booking confirmation...</span>
        </div>
      )}

      {/* Pay Button */}
      <Button
        type="button"
        onClick={handleIntaSendPay}
        disabled={disabled || loading || paymentSuccess}
        className="w-full gap-2 font-medium"
      >
        {loading ? (
          <>
            <Spinner className="size-4" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="size-4" />
            Pay {currency} {amount.toLocaleString()} with IntaSend
            <ArrowRight className="size-4 ml-auto" />
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-green-500" />
        <span>Secured by IntaSend 256-bit encryption</span>
      </div>
    </div>
  )
}
