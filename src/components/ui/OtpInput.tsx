import React, { useRef, useState, useEffect } from "react"
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (code: string) => void
  onResend?: () => void
  resendIntervalSeconds?: number
  loading?: boolean
  success?: boolean
  error?: string | null
}

export default function OtpInput({
  value,
  onChange,
  onComplete,
  onResend,
  resendIntervalSeconds = 60,
  loading = false,
  success = false,
  error = null,
}: OtpInputProps) {
  const [timer, setTimer] = useState(resendIntervalSeconds)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<HTMLInputElement[]>([])

  // Timer logic for resending code
  useEffect(() => {
    if (timer > 0) {
      setCanResend(false)
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setCanResend(true)
    }
  }, [timer])

  const handleResend = () => {
    if (!canResend) return
    setTimer(resendIntervalSeconds)
    onResend?.()
  }

  // Split values into individual fields
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6)

  const handleDigitChange = (val: string, index: number) => {
    const cleaned = val.replace(/\D/g, "")
    if (!cleaned) {
      const newDigits = [...digits]
      newDigits[index] = ""
      const newCode = newDigits.join("")
      onChange(newCode)
      return
    }

    const newDigits = [...digits]
    newDigits[index] = cleaned[0]
    const newCode = newDigits.join("")
    onChange(newCode)

    // Focus next box if entered
    if (index < 5 && cleaned[0]) {
      inputRefs.current[index + 1]?.focus()
    }

    // Trigger complete if filled
    if (newCode.length === 6 && onComplete) {
      onComplete(newCode)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits]
        newDigits[index - 1] = ""
        const newCode = newDigits.join("")
        onChange(newCode)
        inputRefs.current[index - 1]?.focus()
      } else {
        const newDigits = [...digits]
        newDigits[index] = ""
        const newCode = newDigits.join("")
        onChange(newCode)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData("text").trim()
    const cleaned = pastedText.replace(/\D/g, "").slice(0, 6)
    onChange(cleaned)

    const targetIdx = Math.min(cleaned.length, 5)
    inputRefs.current[targetIdx]?.focus()

    if (cleaned.length === 6 && onComplete) {
      onComplete(cleaned)
    }
  }

  return (
    <div className="space-y-4">
      {/* 6 digits containers */}
      <div className="relative flex justify-between gap-2 max-w-[320px]">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(e.target.value, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onPaste={handlePaste}
            ref={(el) => { inputRefs.current[idx] = el as HTMLInputElement }}
            className={cn(
              "size-11 rounded-2xl border-2 bg-card text-center font-mono text-base font-bold text-foreground transition-all duration-200 outline-none",
              success && "border-green-500 bg-green-500/5 text-green-500 shadow-md shadow-green-500/10",
              error && "border-destructive bg-destructive/5 text-destructive shadow-md shadow-destructive/10 animate-shake",
              !success && !error && (digit ? "border-primary ring-2 ring-primary/10 bg-primary/5" : "border-border/80 hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10")
            )}
            disabled={loading}
          />
        ))}

        {/* Loading Spinner overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/60 rounded-2xl backdrop-blur-sm">
            <Spinner className="size-5 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* States details */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-1.5 text-xs text-green-500 font-medium animate-fade-in">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Verification completed successfully!</span>
        </div>
      )}

      {/* Resend Code prompt */}
      {!success && (
        <div className="flex items-center text-xs">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="flex items-center gap-1 text-primary font-semibold hover:underline"
              disabled={loading}
            >
              <RefreshCw className="size-3" /> Resend verification code
            </button>
          ) : (
            <span className="text-muted-foreground">
              Resend code in <strong className="text-foreground">{timer}s</strong>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
