import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
 CheckCircle2,
 AlertCircle,
 Phone,
 ShieldCheck,
 Clock,
 RefreshCw,
 ArrowRight,
 Smartphone,
 Wifi,
 WifiOff,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingSummary {
 tourTitle: string
 bookingDate: string
 guestCount: number
 totalPrice: number
 currency?: string
}

interface MPesaCheckoutProps {
 bookingId: string
 amount: number
 currency?: string
 email: string
 prefillPhone?: string
 bookingSummary?: BookingSummary
 onSuccess?: (paymentId: string) => void
 onError?: (err: string) => void
 className?: string
}

type Step = "review" | "processing" | "waiting" | "success" | "failed" | "timeout"

// ─── Phone formatting ─────────────────────────────────────────────────────────

function formatKenyanPhone(raw: string): string {
 // Strip everything except digits
 const digits = raw.replace(/\D/g, "")

 if (digits.startsWith("254")) {
 // Already has country code
 const local = digits.slice(3, 12)
 if (local.length <= 3) return `+254 ${local}`
 if (local.length <= 6) return `+254 ${local.slice(0, 3)} ${local.slice(3)}`
 return `+254 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
 }

 if (digits.startsWith("0")) {
 const local = digits.slice(1, 10)
 if (local.length <= 3) return `0${local}`
 if (local.length <= 6) return `0${local.slice(0, 3)} ${local.slice(3)}`
 return `0${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
 }

 return raw
}

function normalizePhone(raw: string): string {
 const digits = raw.replace(/\D/g, "")
 if (digits.startsWith("254") && digits.length === 12) return digits
 if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1)
 if (digits.length === 9) return "254" + digits
 return digits
}

function isValidKenyanPhone(raw: string): boolean {
 const normalized = normalizePhone(raw)
 return /^2547\d{8}$/.test(normalized) || /^2541\d{8}$/.test(normalized)
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepBadge({ step, label, active, done }: { step: number; label: string; active: boolean; done: boolean }) {
 return (
 <div className="flex flex-col items-center gap-1">
 <div
 className={cn(
 "flex size-7 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300",
 done
 ? "border-teal-500 bg-teal-500/20 text-teal-400"
 : active
 ? "border-primary bg-primary/20 text-primary shadow-[0_0_10px_rgba(13, 111, 115,0.4)]"
 : "border-border bg-background/30 text-muted-foreground"
 )}
 >
 {done ? <CheckCircle2 className="size-3.5" /> : step}
 </div>
 <span
 className={cn(
 "hidden text-[10px] font-medium sm:block",
 active ? "text-primary" : done ? "text-teal-400" : "text-muted-foreground"
 )}
 >
 {label}
 </span>
 </div>
 )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MPesaCheckout({
 bookingId,
 amount,
 currency = "KES",
 email,
 prefillPhone = "",
 bookingSummary,
 onSuccess,
 onError,
 className = "",
}: MPesaCheckoutProps) {
 const [step, setStep] = useState<Step>("review")
 const [phone, setPhone] = useState(prefillPhone ? formatKenyanPhone(prefillPhone) : "")
 const [phoneError, setPhoneError] = useState<string | null>(null)
 const [errorMessage, setErrorMessage] = useState<string | null>(null)
 const [paymentId, setPaymentId] = useState<string | null>(null)
 const [pollCount, setPollCount] = useState(0)
 const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
 const MAX_POLLS = 20 // 20 × 3s = 60s timeout

 // Clean up polling on unmount
 useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

 function handlePhoneInput(e: React.ChangeEvent<HTMLInputElement>) {
 const formatted = formatKenyanPhone(e.target.value)
 setPhone(formatted)
 setPhoneError(null)
 }

 // ── Initiate payment ────────────────────────────────────────────────────────

 async function handlePay() {
  if (!isValidKenyanPhone(phone)) {
  setPhoneError("Please enter a valid Kenyan phone number (e.g. 0712 345 678 or 0114 785 412).")
  return
  }

  setStep("processing")
  setErrorMessage(null)

  try {
  const normalized = normalizePhone(phone)
  const { data, error: fnErr } = await supabase.functions.invoke("inta-pay-init", {
  body: {
  amount,
  currency,
  email: email.trim().toLowerCase(),
  phone: normalized,
  bookingId,
  method: "STK_PUSH",
  },
  })

  if (fnErr) {
  let msg = fnErr.message || "Failed to reach IntaSend payment function"
  if ((fnErr as any).context) {
  try {
  const bodyText = await (fnErr as any).context.text()
  if (bodyText) {
  const parsed = JSON.parse(bodyText)
  msg = parsed.error || parsed.detail || parsed.message || msg
  }
  } catch (_) {}
  }
  throw new Error(msg)
  }

  if (data?.error) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error))
  if (data?.detail) throw new Error(typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))

  const pid = data?.payment_id || data?.invoice_id || `IS_${bookingId}`
  setPaymentId(pid)
  setStep("waiting")
  startPolling(pid)
  } catch (err: any) {
  console.error("[MPesaCheckout] Payment error:", err)
  const msg = err?.message?.includes("Failed to fetch")
  ? "Connection lost. Please check your internet connection and try again."
  : err?.message || "Could not initiate payment. Please try again."
  setErrorMessage(msg)
  setStep("failed")
  onError?.(msg)
  }
  }

 // ── Poll for verification ───────────────────────────────────────────────────

 function startPolling(pid: string) {
 let count = 0
 pollRef.current = setInterval(async () => {
 count++
 setPollCount(count)

 if (count >= MAX_POLLS) {
 clearInterval(pollRef.current!)
 setStep("timeout")
 return
 }

 try {
 const { data } = await supabase.functions.invoke("inta-pay-verify", {
 body: { payment_id: pid, booking_id: bookingId },
 })

 if (data?.verified || data?.payment_status === "paid") {
 clearInterval(pollRef.current!)
 setStep("success")
 onSuccess?.(pid)
 setTimeout(() => {
 window.location.href = `/payment-success?booking_id=${bookingId}&payment_id=${pid}`
 }, 1800)
 }
 } catch (_) {
 // Swallow poll errors silently
 }
 }, 3000)
 }

 function handleRetry() {
 if (pollRef.current) clearInterval(pollRef.current)
 setPollCount(0)
 setStep("review")
 setErrorMessage(null)
 }

 // ── Render ─────────────────────────────────────────────────────────────────

 const stepIndex: Record<Step, number> = {
 review: 1, processing: 2, waiting: 3, success: 4, failed: 2, timeout: 3,
 }
 const currentStep = stepIndex[step]

 return (
 <div
 className={cn(
 "relative mx-auto w-full max-w-[500px] overflow-hidden rounded-2xl",
 // Glassmorphism card
 "border border-white/10 bg-white/[0.04] shadow-2xl",
 className
 )}
 >
 {/* Ambient glow */}
 <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-teal-500/5" />

 {/* Header */}
 <div className="relative border-b border-white/8 bg-white/[0.02] px-6 py-5">
 <div className="flex items-center justify-between">
 {/* M-PESA brand */}
 <div className="flex items-center gap-3">
 <div className="flex size-10 items-center justify-center rounded-xl bg-green-500/15 ring-1 ring-green-500/25">
 <Smartphone className="size-5 text-green-400" />
 </div>
 <div>
 <p className="text-sm font-bold tracking-wide text-foreground">M-PESA Payment</p>
 <p className="text-[11px] text-muted-foreground">Powered by IntaSend · Tier 2 Verified</p>
 </div>
 </div>
 {/* Amount chip */}
 <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-right">
 <span className="text-[11px] font-medium uppercase tracking-wider text-primary/70">{currency}</span>
 <p className="text-base font-bold leading-none text-primary">{amount.toLocaleString()}</p>
 </div>
 </div>

 {/* Step indicator */}
 <div className="mt-5 flex items-center gap-0">
 {(["Review", "Confirm", "Waiting", "Done"] as const).map((label, i) => (
 <div key={label} className="flex flex-1 items-center">
 <StepBadge step={i + 1} label={label} active={currentStep === i + 1} done={currentStep > i + 1} />
 {i < 3 && (
 <div
 className={cn(
 "mx-1 h-px flex-1 transition-colors duration-500",
 currentStep > i + 1 ? "bg-teal-500/50" : "bg-border/40"
 )}
 />
 )}
 </div>
 ))}
 </div>
 </div>

 {/* Body */}
 <div className="relative px-6 py-6">
 <AnimatePresence mode="wait">

 {/* ── REVIEW ── */}
 {step === "review" && (
 <motion.div
 key="review"
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -12 }}
 transition={{ duration: 0.22 }}
 className="space-y-5"
 >
 {/* Booking summary */}
 {bookingSummary && (
 <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-sm">
 <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Booking Summary</p>
 <div className="space-y-2">
 <div className="flex justify-between">
 <span className="text-muted-foreground">{bookingSummary.tourTitle}</span>
 </div>
 <div className="flex justify-between text-xs text-muted-foreground">
 <span>📅 {bookingSummary.bookingDate}</span>
 <span>👥 {bookingSummary.guestCount} guest{bookingSummary.guestCount !== 1 ? "s" : ""}</span>
 </div>
 <div className="flex justify-between border-t border-white/8 pt-2 font-semibold">
 <span>Total</span>
 <span className="text-primary">{currency} {bookingSummary.totalPrice.toLocaleString()}</span>
 </div>
 </div>
 </div>
 )}

 {/* Phone input */}
 <div className="space-y-1.5">
 <Label htmlFor="mpesa-phone" className="text-sm text-foreground">
 M-PESA Phone Number
 </Label>
 <div className="relative">
 <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
 <Input
 id="mpesa-phone"
 type="tel"
 value={phone}
 onChange={handlePhoneInput}
 placeholder="0712 345 678"
 maxLength={16}
 className={cn(
 "h-11 rounded-xl border-white/10 bg-card shadow-modern pl-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/50",
 phoneError && "border-red-500/50 focus-visible:ring-red-500/30"
 )}
 />
 </div>
  {phoneError ? (
  <p className="flex items-center gap-1.5 text-[11px] text-red-400">
  <AlertCircle className="size-3" /> {phoneError}
  </p>
  ) : (
  <div className="space-y-1">
  <p className="text-[11px] text-muted-foreground">
  Enter the phone number registered with your M-PESA account.
  </p>
  <p className="text-[10px] text-amber-500/90 font-medium">
  💡 Sandbox mode: Use test number <code className="px-1 py-0.5 rounded bg-amber-500/10 font-bold">254708374149</code> (PIN: 12345) to test STK Push simulation.
  </p>
  </div>
  )}
  </div>


 {/* What to expect */}
 <div className="space-y-2 rounded-xl border border-white/8 bg-white/[0.02] p-4">
 <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">What happens next</p>
 {[
 "We send a payment prompt to your phone",
 "Open your M-PESA app and enter your PIN",
 "Payment is confirmed automatically",
 ].map((step, i) => (
 <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
 <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">{i + 1}</span>
 {step}
 </div>
 ))}
 </div>

 {/* Pay button */}
 <button
 onClick={handlePay}
 className="group relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
 style={{
 background: "linear-gradient(135deg, #0D6F73 0%, #6B46E0 100%)",
 boxShadow: "0 4px 20px rgba(13, 111, 115,0.35)",
 }}
 >
 <span className="relative z-10 flex items-center justify-center gap-2">
 Pay {currency} {amount.toLocaleString()} via M-PESA
 <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
 </span>
 <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
 </button>

 <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
 <ShieldCheck className="size-3.5 text-green-400" />
 Secured by IntaSend · 256-bit encryption
 </div>
 </motion.div>
 )}

 {/* ── PROCESSING ── */}
 {step === "processing" && (
 <motion.div
 key="processing"
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ duration: 0.22 }}
 className="flex flex-col items-center gap-5 py-8 text-center"
 >
 <div className="relative">
 <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
 <div className="relative flex size-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
 <Spinner className="size-7 text-primary" />
 </div>
 </div>
 <div>
 <p className="text-base font-semibold text-foreground">Sending payment request…</p>
 <p className="mt-1 text-sm text-muted-foreground">Connecting to IntaSend servers</p>
 </div>
 </motion.div>
 )}

 {/* ── WAITING ── */}
 {step === "waiting" && (
 <motion.div
 key="waiting"
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -12 }}
 transition={{ duration: 0.22 }}
 className="flex flex-col items-center gap-5 py-6 text-center"
 >
 {/* Animated phone icon */}
 <div className="relative">
 <motion.div
 animate={{ scale: [1, 1.08, 1] }}
 transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
 className="flex size-16 items-center justify-center rounded-2xl bg-green-500/10 ring-1 ring-green-500/25"
 >
 <Smartphone className="size-8 text-green-400" />
 </motion.div>
 <motion.div
 animate={{ opacity: [0.4, 1, 0.4] }}
 transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
 className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white"
 >
 !
 </motion.div>
 </div>

 <div>
 <p className="text-base font-semibold text-foreground">Check your phone!</p>
 <p className="mt-1 text-sm text-muted-foreground">
 A payment prompt has been sent to{" "}
 <span className="font-semibold text-foreground">{phone}</span>
 </p>
 </div>

 <div className="w-full space-y-2 rounded-xl border border-white/8 bg-white/[0.02] p-4 text-left text-sm">
 <div className="flex items-center gap-2 text-green-400">
 <CheckCircle2 className="size-4" />
 <span>STK Push sent to your device</span>
 </div>
 {[
 "Open your M-PESA app or SMS prompt",
 "Enter your M-PESA PIN to confirm",
 "We'll detect your payment automatically",
 ].map((instruction, i) => (
 <div key={i} className="flex items-center gap-2 text-muted-foreground">
 <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-card shadow-modern text-[10px]">{i + 2}</span>
 {instruction}
 </div>
 ))}
 </div>

 {/* Poll progress */}
 <div className="flex w-full flex-col items-center gap-2">
 <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
 <Wifi className="size-3.5 animate-pulse text-primary" />
 <span>Waiting for confirmation…</span>
 <span className="ml-auto tabular-nums text-[11px]">
 {Math.max(0, MAX_POLLS - pollCount) * 3}s remaining
 </span>
 </div>
 <div className="h-1 w-full overflow-hidden rounded-full bg-card shadow-modern">
 <motion.div
 className="h-full rounded-full bg-primary"
 animate={{ width: `${(pollCount / MAX_POLLS) * 100}%` }}
 transition={{ duration: 0.5 }}
 />
 </div>
 </div>

 <button
 onClick={handleRetry}
 className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
 >
 <RefreshCw className="size-3" /> Cancel & try again
 </button>
 </motion.div>
 )}

 {/* ── SUCCESS ── */}
 {step === "success" && (
 <motion.div
 key="success"
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
 className="flex flex-col items-center gap-4 py-8 text-center"
 >
 <motion.div
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 transition={{ delay: 0.1, type: "spring", bounce: 0.5 }}
 className="flex size-16 items-center justify-center rounded-full bg-green-500/15 ring-2 ring-green-500/30"
 >
 <CheckCircle2 className="size-8 text-green-400" />
 </motion.div>
 <div>
 <p className="text-lg font-bold text-foreground">Payment Confirmed! 🎉</p>
 <p className="mt-1 text-sm text-muted-foreground">Your booking is now confirmed. Redirecting…</p>
 </div>
 </motion.div>
 )}

 {/* ── FAILED ── */}
 {step === "failed" && (
 <motion.div
 key="failed"
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.22 }}
 className="flex flex-col items-center gap-5 py-6 text-center"
 >
 <div className="flex size-14 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/25">
 <WifiOff className="size-7 text-red-400" />
 </div>
 <div>
 <p className="text-base font-semibold text-foreground">Payment Failed</p>
 <p className="mt-1 text-sm text-muted-foreground">
 {errorMessage || "Something went wrong. Please try again."}
 </p>
 </div>
 <button
 onClick={handleRetry}
 className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card shadow-modern"
 >
 <RefreshCw className="size-4" /> Try Again
 </button>
 </motion.div>
 )}

 {/* ── TIMEOUT ── */}
 {step === "timeout" && (
 <motion.div
 key="timeout"
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.22 }}
 className="flex flex-col items-center gap-5 py-6 text-center"
 >
 <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/25">
 <Clock className="size-7 text-amber-400" />
 </div>
 <div>
 <p className="text-base font-semibold text-foreground">Confirmation Timeout</p>
 <p className="mt-1 text-sm text-muted-foreground">
 We haven't received confirmation yet. Please check your M-PESA app or retry.
 </p>
 </div>
 <div className="flex gap-3">
 <button
 onClick={() => {
 if (paymentId) {
 setPollCount(0)
 setStep("waiting")
 startPolling(paymentId)
 }
 }}
 className="flex items-center gap-1.5 rounded-xl border border-primary/40 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
 >
 <Wifi className="size-4" /> Check Again
 </button>
 <button
 onClick={handleRetry}
 className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-card shadow-modern"
 >
 <RefreshCw className="size-4" /> Retry
 </button>
 </div>
 </motion.div>
 )}

 </AnimatePresence>
 </div>
 </div>
 )
}
