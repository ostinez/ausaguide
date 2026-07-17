import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { supabase } from "../lib/supabase"
import { checkRateLimit } from "@/lib/api/rate-limit"
import { sendGeneralWaitlistEmail } from "@/lib/api/emails"
import {
  Loader2, CheckCircle2, User, Mail, Sparkles, MapPin,
  AlignLeft, Share2, RefreshCw, PartyPopper, Rocket,
} from "lucide-react"
import { CountdownTimer } from "@/components/ui/CountdownTimer"

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const LAUNCH_DATE = new Date("2026-10-10T00:00:00Z")
const LS_KEY = "waitlist_confirmed_email"
const LS_NAME_KEY = "waitlist_confirmed_name"

type WaitlistStatus = "loading" | "not_on_list" | "pending" | "confirmed"

// ── Share helpers ────────────────────────────────────────────────────────────
const SHARE_TEXT = encodeURIComponent(
  "I just joined the Ausaguide waitlist — the platform that connects travellers with authentic local guides in Kenya. Launching October 10, 2026! Join me:"
)
const SHARE_URL = encodeURIComponent("https://ausaguide.com/waitlist")

function ShareButtons() {
  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-xs font-bold text-white/40 uppercase tracking-widest text-center">
        Share with friends
      </p>
      <div className="flex gap-3 justify-center">
        {/* Twitter / X */}
        <a
          href={`https://twitter.com/intent/tweet?text=${SHARE_TEXT}&url=${SHARE_URL}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 text-[#1DA1F2] text-xs font-bold hover:bg-[#1DA1F2]/20 transition-colors"
        >
          <XIcon className="size-3.5" />
          Twitter
        </a>
        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${SHARE_TEXT}%20https%3A%2F%2Fausaguide.com%2Fwaitlist`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-xs font-bold hover:bg-[#25D366]/20 transition-colors"
        >
          <Share2 className="size-3.5" />
          WhatsApp
        </a>
        {/* LinkedIn */}
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${SHARE_URL}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A66C2]/10 border border-[#0A66C2]/30 text-[#0A66C2] text-xs font-bold hover:bg-[#0A66C2]/20 transition-colors"
        >
          <Share2 className="size-3.5" />
          LinkedIn
        </a>
      </div>
    </div>
  )
}

// ── Celebration panel ────────────────────────────────────────────────────────
function CelebrationPanel({ name, email }: { name: string; email: string }) {
  return (
    <div className="w-full space-y-6 animate-in fade-in zoom-in duration-500">
      {/* Countdown */}
      <CountdownTimer targetDate={LAUNCH_DATE} />

      {/* Celebration card */}
      <div
        className="rounded-3xl border border-[#7F5AF0]/30 p-8 backdrop-blur-xl shadow-2xl shadow-[#7F5AF0]/10 text-center space-y-6"
        style={{ background: "linear-gradient(145deg, rgba(127,90,240,0.08) 0%, rgba(18,18,20,0.9) 60%)" }}
      >
        {/* Confetti emoji burst */}
        <div className="flex justify-center">
          <div className="relative size-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#7F5AF0]/20 animate-ping opacity-30" />
            <div className="relative size-16 rounded-full bg-[#7F5AF0]/15 border border-[#7F5AF0]/30 flex items-center justify-center text-3xl shadow-lg shadow-[#7F5AF0]/20">
              <PartyPopper className="size-8 text-[#7F5AF0]" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-3">
            <Rocket className="size-7 text-[#7F5AF0]" />
            You're on the list!
          </h1>
          <p className="text-sm text-white/60 leading-relaxed max-w-xs mx-auto">
            {name ? `Hey ${name}! ` : ""}We'll notify{" "}
            <span className="text-[#7F5AF0] font-semibold">{email}</span> when
            Ausaguide launches on{" "}
            <span className="text-white font-semibold">October 10, 2026</span>.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#7F5AF0]/30 to-transparent" />

        <ShareButtons />
      </div>
    </div>
  )
}

// ── Pending panel (email not yet confirmed) ──────────────────────────────────
function PendingBanner({ email, onResend, resending }: { email: string; onResend: () => void; resending: boolean }) {
  return (
    <div className="rounded-2xl border border-[#7F5AF0]/40 bg-[#7F5AF0]/8 backdrop-blur-sm p-5 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="size-8 rounded-full bg-[#7F5AF0]/15 flex items-center justify-center shrink-0 mt-0.5">
          <Mail className="size-4 text-[#7F5AF0]" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Check your inbox!</p>
          <p className="text-xs text-white/60 leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="text-[#7F5AF0] font-semibold">{email}</span>.
            Click it to secure your confirmed spot.
          </p>
        </div>
      </div>
      <button
        onClick={onResend}
        disabled={resending}
        className="flex items-center justify-center gap-2 text-xs font-bold text-[#7F5AF0] hover:text-[#7F5AF0]/80 transition-colors disabled:opacity-50 py-1"
      >
        {resending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <RefreshCw className="size-3.5" />
        )}
        Resend confirmation email
      </button>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function WaitlistPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [status, setStatus]           = useState<WaitlistStatus>("loading")
  const [confirmedEmail, setConfirmedEmail] = useState("")
  const [confirmedName, setConfirmedName]   = useState("")

  // Form state
  const [name, setName]           = useState("")
  const [email, setEmail]         = useState("")
  const [role, setRole]           = useState<"traveler" | "host" | "both">("traveler")
  const [location, setLocation]   = useState("")
  const [reason, setReason]       = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [pendingEmail, setPendingEmail] = useState("")
  const [pendingName, setPendingName]   = useState("")
  const [resending, setResending]       = useState(false)

  // ── Token confirmation flow ────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const token = searchParams.get("token")

      // 1. Token in URL → confirm in DB
      if (token) {
        try {
          const { data, error } = await supabase.rpc("confirm_waitlist", { p_token: token })
          if (error) throw error
          const confirmedEmailResult = Array.isArray(data) ? data[0] : data
          if (confirmedEmailResult) {
            // Store in localStorage for future visits
            localStorage.setItem(LS_KEY, confirmedEmailResult)
            // Try to get their name from waitlist table
            const { data: row } = await supabase
              .from("waitlist")
              .select("name")
              .eq("email", confirmedEmailResult)
              .maybeSingle()
            if (row?.name) localStorage.setItem(LS_NAME_KEY, row.name)
            setConfirmedEmail(confirmedEmailResult)
            setConfirmedName(row?.name ?? "")
            setStatus("confirmed")
            // Clean URL parameters but keep ?confirmed=true so they are on confirmation route
            setSearchParams({ confirmed: "true" }, { replace: true })
            toast.success("Email confirmed! You're on the list!")
            return
          }
        } catch (err) {
          console.error("Confirmation error:", err)
          toast.error("This confirmation link is invalid or already used.")
        }
        setStatus("not_on_list")
        setSearchParams({}, { replace: true })
        return
      }

      // 2. If confirmedParam is true or standard page view, check if they are already confirmed via localStorage
      const savedEmail = localStorage.getItem(LS_KEY)
      if (savedEmail) {
        // Quick DB verify
        const { data: row } = await supabase
          .from("waitlist")
          .select("confirmed, name")
          .eq("email", savedEmail)
          .maybeSingle()
        if (row?.confirmed) {
          setConfirmedEmail(savedEmail)
          setConfirmedName(row.name ?? localStorage.getItem(LS_NAME_KEY) ?? "")
          setStatus("confirmed")
          return
        }
        // Was on waitlist but not confirmed
        if (row) {
          setPendingEmail(savedEmail)
          setPendingName(row.name ?? "")
          setStatus("pending")
          return
        }
      }

      // 3. Check if logged-in user's email is on the waitlist
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const { data: row } = await supabase
          .from("waitlist")
          .select("confirmed, name")
          .eq("email", user.email)
          .maybeSingle()
        if (row?.confirmed) {
          localStorage.setItem(LS_KEY, user.email)
          if (row.name) localStorage.setItem(LS_NAME_KEY, row.name)
          setConfirmedEmail(user.email)
          setConfirmedName(row.name ?? "")
          setStatus("confirmed")
          return
        }
        if (row) {
          setPendingEmail(user.email)
          setPendingName(row.name ?? "")
          setStatus("pending")
          return
        }
      }

      // 4. Default: New visitor. (If URL contains confirmed=true via sharing, they still see form)
      setStatus("not_on_list")
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Form submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { toast.error("Please fill in all required fields."); return }
    if ((role === "host" || role === "both") && (!location.trim() || !reason.trim())) {
      toast.error("Please fill in the location and why you want to host."); return
    }

    setSubmitting(true)

    // Rate limit check: max 3 waitlist submissions per hour per IP
    let ipAddress = "local"
    try {
      const res = await fetch("https://api.ipify.org?format=json")
      if (res.ok) {
        const data = await res.json()
        if (data && data.ip) ipAddress = data.ip
      }
    } catch (err) {
      console.warn("IP fetch failed, falling back to local identifier", err)
    }

    try {
      const rateLimitKey = `waitlist:${ipAddress}`
      const limitResult = await checkRateLimit(rateLimitKey, { max: 3, windowMs: 60 * 60 * 1000 })
      if (!limitResult.allowed) {
        toast.error("Too many waitlist submissions. Please try again later.")
        setSubmitting(false)
        return
      }
    } catch (limitErr) {
      console.error("Rate check failed, proceeding anyway", limitErr)
    }
    try {
      // Insert row (DB auto-generates confirm_token)
      const { data: inserted, error } = await supabase
        .from("waitlist")
        .insert({
          name: name.trim(),
          email: email.trim(),
          role,
          location: (role === "host" || role === "both") ? location.trim() : null,
          reason:   (role === "host" || role === "both") ? reason.trim()   : null,
        })
        .select("confirm_token")
        .single()

      if (error) {
        if (error.code === "23505") {
          // Already on list — check confirmed status
          const { data: row } = await supabase
            .from("waitlist")
            .select("confirmed, confirm_token, name")
            .eq("email", email.trim())
            .maybeSingle()
          if (row?.confirmed) {
            localStorage.setItem(LS_KEY, email.trim())
            if (row.name) localStorage.setItem(LS_NAME_KEY, row.name)
            setConfirmedEmail(email.trim())
            setConfirmedName(row.name ?? "")
            setStatus("confirmed")
            return
          }
          // Not confirmed — re-send email
          if (row) {
            await sendGeneralWaitlistEmail(email.trim(), name.trim(), role, row.confirm_token)
            toast.info("You're already on the list! Confirmation email resent.")
            setPendingEmail(email.trim())
            setPendingName(name.trim())
            setStatus("pending")
            return
          }
        }
        throw error
      }

      // Send confirmation email with token
      await sendGeneralWaitlistEmail(
        email.trim(),
        name.trim(),
        role,
        inserted?.confirm_token ?? undefined
      )

      toast.success("Confirmation email sent! Check your inbox.")
      localStorage.setItem("waitlist_pending_email", email.trim())
      setPendingEmail(email.trim())
      setPendingName(name.trim())
      setStatus("pending")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Resend confirmation ───────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (!pendingEmail) return
    setResending(true)
    try {
      const { data: row } = await supabase
        .from("waitlist")
        .select("confirm_token, name")
        .eq("email", pendingEmail)
        .maybeSingle()
      if (!row) { toast.error("Email not found in waitlist."); return }
      await sendGeneralWaitlistEmail(pendingEmail, row.name ?? pendingName, "traveler", row.confirm_token)
      toast.success("Confirmation email resent!")
    } catch (err: any) {
      toast.error(err.message || "Failed to resend.")
    } finally {
      setResending(false)
    }
  }, [pendingEmail, pendingName])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0d0d12] text-foreground relative overflow-hidden flex flex-col items-center justify-center py-20 px-6">
      {/* Background blobs */}
      <div className="absolute top-10 left-1/4 h-[350px] w-[350px] rounded-full bg-[#7F5AF0]/8 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 h-[400px] w-[400px] rounded-full bg-[#2CB67D]/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#7F5AF0]/4 blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">

        {/* ── Loading ── */}
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-20">
            <Loader2 className="size-8 text-[#7F5AF0] animate-spin" />
            <p className="text-sm text-white/40">Checking your status…</p>
          </div>
        )}

        {/* ── Confirmed ── */}
        {status === "confirmed" && (
          <CelebrationPanel email={confirmedEmail} name={confirmedName} />
        )}

        {/* ── Pending or Not On List ── */}
        {(status === "pending" || status === "not_on_list") && (
          <div className="space-y-6">
            {/* Countdown always visible */}
            <CountdownTimer targetDate={LAUNCH_DATE} />

            {/* Pending banner */}
            {status === "pending" && (
              <PendingBanner
                email={pendingEmail}
                onResend={handleResend}
                resending={resending}
              />
            )}

            {/* Form card */}
            <div className="rounded-3xl border border-white/8 p-8 backdrop-blur-xl bg-[#121214]/70 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7F5AF0]/10 border border-[#7F5AF0]/20 text-xs font-semibold text-[#7F5AF0] mb-2">
                  <Sparkles className="size-3.5" />
                  <span>Join our early waiting list</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">Ausaguide Waiting List</h1>
                <p className="text-xs sm:text-sm text-white/60 max-w-sm mx-auto leading-relaxed">
                  Be the first to explore local experiences. Join now and get early access when we launch on{" "}
                  <span className="text-white font-semibold">October 10, 2026</span>.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-white/4 border border-white/8 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#7F5AF0]/60 transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-white/4 border border-white/8 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#7F5AF0]/60 transition-colors"
                    />
                  </div>
                </div>

                {/* Role picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">I want to join as a: *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["traveler", "host", "both"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                          role === r
                            ? "border-[#7F5AF0] bg-[#7F5AF0]/12 text-white shadow-sm shadow-[#7F5AF0]/20"
                            : "border-white/8 bg-white/3 text-white/50 hover:border-white/20 hover:text-white/70"
                        }`}
                      >
                        {r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Host-only fields */}
                {(role === "host" || role === "both") && (
                  <>
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Where are you located? *</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                        <input
                          type="text"
                          required
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Nairobi, Narok, Lamu"
                          className="w-full bg-white/4 border border-white/8 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#7F5AF0]/60 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Why do you want to host? *</label>
                      <div className="relative">
                        <AlignLeft className="absolute left-4 top-4 size-4 text-white/30" />
                        <textarea
                          required
                          rows={3}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Share details about the heritage or tours you want to guide..."
                          className="w-full bg-white/4 border border-white/8 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#7F5AF0]/60 transition-colors resize-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3.5 rounded-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white text-sm font-bold shadow-lg hover:shadow-[0_4px_20px_rgba(127,90,240,0.4)] disabled:opacity-50 transition duration-300 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Adding to Waitlist…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      <span>Join the Waitlist</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
