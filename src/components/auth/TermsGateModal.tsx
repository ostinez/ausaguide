import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ShieldCheck, ArrowRight, LogOut, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface TermsGateModalProps {
  userId: string
  onAgreed: () => void
}

export function TermsGateModal({ userId, onAgreed }: TermsGateModalProps) {
  const navigate = useNavigate()
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleAccept() {
    if (!agreed) return
    setSubmitting(true)
    try {
      const now = new Date().toISOString()
      
      // Save locally
      localStorage.setItem("terms_agreed", "true")
      localStorage.setItem("terms_accepted", "true")
      if (userId) {
        localStorage.setItem(`terms_agreed_${userId}`, "true")
      }

      // Update Supabase auth user metadata
      try {
        await supabase.auth.updateUser({
          data: {
            terms_agreed: true,
            terms_accepted: true,
            terms_agreed_at: now,
          },
        })
      } catch (authErr) {
        console.warn("Could not update auth metadata:", authErr)
      }

      // Update profiles row if possible
      try {
        if (userId) {
          await supabase
            .from("profiles")
            .update({
              terms_agreed: true,
              terms_agreed_at: now,
            } as any)
            .eq("id", userId)
        }
      } catch (profErr) {
        console.warn("Could not update profile terms_agreed:", profErr)
      }

      toast.success("Terms accepted. Welcome to Ausaguide!")
      onAgreed()
    } catch (err: any) {
      console.error("Failed to accept terms:", err)
      toast.error("An error occurred while saving your consent. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn("Sign out failed:", e)
    }
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_role")
    navigate("/")
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-gate-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-[#235E5D]/60 bg-[#0c1a19] p-6 sm:p-8 shadow-2xl shadow-black/80 text-center">
        {/* Top badge */}
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0D6F73]/30 via-emerald-500/20 to-[#10b981]/25 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
          <ShieldCheck className="size-8 text-emerald-400" />
        </div>

        {/* Headline */}
        <h2 id="terms-gate-title" className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Terms of Service & Privacy Policy
        </h2>

        {/* Subtext */}
        <p className="mt-2 text-xs sm:text-sm text-gray-300 leading-relaxed max-w-md mx-auto">
          Before accessing your dashboard, please review and accept our Terms of Service and Privacy Policy to ensure compliance and community safety.
        </p>

        {/* Highlights */}
        <div className="mt-5 p-3.5 rounded-xl bg-[#142928]/90 border border-[#235E5D]/30 text-left space-y-2">
          <div className="flex items-center gap-2.5 text-xs text-gray-300">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span>Strict data protection — we never sell your personal information.</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-gray-300">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span>Encrypted transmissions & secure verification.</span>
          </div>
        </div>

        {/* Mandatory Checkbox */}
        <div className="mt-6 flex items-start gap-3 text-left p-3.5 rounded-xl bg-[#091413] border border-[#235E5D]/50">
          <input
            id="terms-gate-checkbox"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="rounded border-border text-emerald-500 focus:ring-emerald-500 size-4 mt-0.5 accent-[#0D6F73] cursor-pointer shrink-0"
          />
          <label htmlFor="terms-gate-checkbox" className="text-xs text-gray-200 select-none cursor-pointer leading-relaxed">
            I agree to the{" "}
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#38b2ac] hover:text-[#0D6F73] underline underline-offset-2 font-semibold"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#38b2ac] hover:text-[#0D6F73] underline underline-offset-2 font-semibold"
            >
              Privacy Policy
            </Link>
            .
          </label>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <Button
            id="terms-gate-continue"
            type="button"
            disabled={!agreed || submitting}
            onClick={handleAccept}
            className="w-full sm:flex-1 rounded-xl bg-gradient-to-r from-[#0D6F73] to-[#10b981] hover:from-[#0a585b] hover:to-[#059669] text-white font-bold py-2.5 shadow-lg shadow-[#0D6F73]/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Spinner className="size-4 text-white animate-spin" />
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleSignOut}
            className="w-full sm:w-auto text-gray-400 hover:text-white hover:bg-white/10 rounded-xl text-xs py-2.5 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="size-3.5" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
