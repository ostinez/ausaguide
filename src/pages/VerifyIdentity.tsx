import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { ShieldCheck, Check, UserCheck, RefreshCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useSEO } from "@/hooks/useSEO"

async function extractErrorMessage(err: any): Promise<string> {
  if (!err) return "An unexpected error occurred."
  if (err?.context) {
    try {
      const cloned = typeof err.context.clone === "function" ? err.context.clone() : err.context
      const body = await cloned.json()
      if (body?.error) return body.error
      if (body?.message) return body.message
      if (body?.detail) return body.detail
    } catch {
      try {
        const text = await err.context.text()
        if (text) {
          try {
            const parsed = JSON.parse(text)
            if (parsed.error) return parsed.error
            if (parsed.message) return parsed.message
            if (parsed.detail) return parsed.detail
          } catch {
            return text
          }
        }
      } catch {}
    }
  }
  if (err?.message && err.message !== "Edge Function returned a non-2xx status code") {
    return err.message
  }
  return "Could not connect to identity verification service. Please try again or submit for manual review."
}

export interface VerifyIdentityProps {
  userId?: string
  hostTier?: "certified_guide" | "local_host" | null
  onComplete?: (isApprovedLocalHost: boolean) => void
}

export function VerifyIdentity({
  userId: propUserId,
  hostTier: _propHostTier,
  onComplete,
}: VerifyIdentityProps) {
  const navigate = useNavigate()
  const userId = propUserId || localStorage.getItem("user_id") || ""

  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dots, setDots] = useState("")
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null)
  const pollingStarted = useRef(false)

  useSEO({
    title: "Verify Your Identity | Ausaguide",
    description: "Secure, bank-level identity verification powered by Didit for Ausaguide hosts.",
  })

  useEffect(() => {
    if (!polling) return
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."))
    }, 600)
    return () => clearInterval(interval)
  }, [polling])

  async function handleVerificationSuccess() {
    if (onComplete) {
      onComplete(true)
    } else {
      toast.success("Identity verified successfully!")
      navigate("/account-verified")
    }
  }

  async function handleManualReviewFallback() {
    setLoading(true)
    try {
      const { error: updErr } = await supabase
        .from("profiles")
        .update({
          verification_status: "pending_review",
          status: "pending",
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", userId)

      if (updErr) {
        console.error("Error submitting for manual review:", updErr)
      }

      toast.info("Your application has been submitted for manual admin review.")
      localStorage.setItem("user_id", userId)
      localStorage.setItem("user_role", "traveler")
      if (onComplete) {
        onComplete(false)
      } else {
        navigate("/pending-verification", { replace: true })
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit for manual review.")
    } finally {
      setLoading(false)
    }
  }

  async function startVerification() {
    if (!userId) {
      setError("User ID missing. Please log in first.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const redirectUrl = `${window.location.origin}/onboarding?didit_done=true&role=host&user_id=${userId}`
      const { data, error: functionErr } = await supabase.functions.invoke("verify-identity", {
        body: { userId, redirectUrl }
      })
      if (functionErr) {
        const msg = await extractErrorMessage(functionErr)
        throw new Error(msg)
      }
      if (data?.error) {
        throw new Error(data.error)
      }
      if (!data?.url) throw new Error("Verification URL was not returned.")

      setVerificationUrl(data.url)
      window.open(data.url, "_blank")
      setLoading(false)
      startPolling()
    } catch (err: any) {
      const msg = await extractErrorMessage(err)
      setError(msg)
      setLoading(false)
    }
  }

  async function checkStatus() {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: functionErr } = await supabase.functions.invoke("verify-identity", {
        body: { userId, action: "check-status" }
      })
      if (functionErr) {
        const msg = await extractErrorMessage(functionErr)
        throw new Error(msg)
      }
      if (data?.error) {
        throw new Error(data.error)
      }

      if (data?.verified || data?.status === "approved" || data?.status === "verified") {
        toast.success("Identity verified successfully!")
        await handleVerificationSuccess()
      } else if (data?.status === "declined") {
        setError("Verification was declined. Please re-check your document and try again.")
      } else if (data?.status === "failed") {
        setError("Something went wrong during verification. Please contact support.")
      } else {
        toast.info("Verification status: " + (data?.status || "started"))
        pollingStarted.current = false
        startPolling()
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function startPolling() {
    setPolling(true)
    setError(null)
    let attempts = 0
    const maxAttempts = 120

    const interval = setInterval(async () => {
      attempts++
      try {
        const { data, error: queryErr } = await supabase
          .from("profiles")
          .select("id_verified, verification_status, status")
          .eq("id", userId)
          .single()

        if (queryErr) throw queryErr

        if (data?.id_verified || data?.verification_status === "approved" || data?.verification_status === "verified" || data?.status === "active") {
          clearInterval(interval)
          setPolling(false)
          toast.success("Identity verified successfully!")
          await handleVerificationSuccess()
          return
        }

        if (data?.verification_status === "declined") {
          clearInterval(interval)
          setPolling(false)
          setError("Verification was declined. Please re-check your document and try again.")
          return
        }
      } catch (err) {
        console.error("Polling error:", err)
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval)
        setPolling(false)
        setError("timed_out")
      }
    }, 3000)
  }

  return (
    <div className="flex flex-col items-center text-center gap-6 py-8 px-4 w-full max-w-xl mx-auto">
      {/* Reassuring ShieldCheck Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0D6F73]/25 via-emerald-500/20 to-[#10b981]/25 border border-emerald-500/30 shadow-xl shadow-emerald-500/10 text-white"
      >
        <ShieldCheck className="size-10 text-emerald-400" />
      </motion.div>

      {/* Anxiety-Reducing Headline & Subtext */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Let's make sure you're you. (No, we don't want your firstborn).
        </h1>
        <p className="text-sm sm:text-base text-gray-300 max-w-lg mx-auto leading-relaxed">
          We know scanning your ID feels a bit invasive. But in a world of catfish and scammers, this is how we keep Ausaguide safe. We partner with Didit to handle this securely.
        </p>
      </div>

      {/* Trust Bullets */}
      <div className="w-full max-w-md mx-auto rounded-2xl bg-[#142928]/80 border border-[#235E5D]/40 p-4 text-left shadow-lg space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Check className="size-3.5" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-200">
            We don't sell your data. Ever.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Check className="size-3.5" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-200">
            Bank-level encryption.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Check className="size-3.5" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-200">
            We don't store your selfies after verification.
          </span>
        </div>
      </div>

      {/* Link to how we protect your data */}
      <div className="text-center -mt-1">
        <Link
          to="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#38b2ac] hover:text-[#0D6F73] underline underline-offset-4 font-semibold transition-colors cursor-pointer"
        >
          Read how we protect your data
        </Link>
      </div>

      {/* Error state */}
      {error && !polling && (
        <div className="flex flex-col items-center gap-3 w-full max-w-sm">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-400 w-full text-center leading-relaxed">
            {error}
          </div>

          {verificationUrl && (
            <a
              href={verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Open Verification Page ↗
            </a>
          )}

          <Button
            size="lg"
            disabled={loading}
            onClick={startVerification}
            className="rounded-full bg-[#0D6F73] hover:bg-[#0a585b] text-white font-bold w-full flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Spinner className="size-4" /> : <>Retry Verification <RefreshCw className="size-4" /></>}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={handleManualReviewFallback}
            className="rounded-full border-white/20 text-white/80 hover:text-white hover:bg-white/10 text-xs py-2 w-full flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="size-3.5 text-emerald-400" />
            Continue with Manual Review
          </Button>
          <p className="text-[11px] text-white/40 text-center">
            Our admin team will review and approve your application within 24 hours.
          </p>
        </div>
      )}

      {/* Action CTA */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {polling ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <Spinner className="size-6 text-[#0D6F73]" />
            <p className="text-sm font-semibold text-[#0D6F73] animate-pulse">
              Verifying your details{dots}
            </p>
            <p className="text-xs text-white/40 max-w-xs mx-auto">
              Please complete verification in the opened window.
            </p>
            {verificationUrl && (
              <a
                href={verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#38b2ac] hover:underline font-semibold transition-colors mt-1"
              >
                Verification page did not open? Click here ↗
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={checkStatus}
              className="mt-2 rounded-full border-white/20 text-white font-semibold text-xs py-1 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? "Checking..." : "Force Check Status"} <Search className="size-3.5" />
            </Button>
          </div>
        ) : (
          !error && (
            <Button
              size="lg"
              disabled={loading}
              onClick={startVerification}
              className="rounded-full bg-gradient-to-r from-[#0D6F73] to-[#10b981] hover:from-[#0a585b] hover:to-[#059669] text-white font-bold shadow-lg shadow-[#0D6F73]/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Spinner className="size-4" /> : "Verify with Didit"} <UserCheck className="size-4" />
            </Button>
          )
        )}
      </div>
    </div>
  )
}

export default VerifyIdentity
