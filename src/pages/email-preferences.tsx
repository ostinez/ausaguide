import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, CheckCircle2, AlertCircle, Loader2, BellOff, Bell } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useSEO } from "@/hooks/useSEO"

export default function EmailPreferencesPage() {
  useSEO({
    title: "Email Preferences – Ausaguide",
    description: "Manage your email notification and newsletter preferences for Ausaguide.",
  })

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "found" | "not_found" | "saved">("idle")
  const [optIn, setOptIn] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStatus("idle")
    if (!email.trim()) return
    setLoading(true)
    try {
      const { data, error: qErr } = await supabase
        .from("profiles")
        .select("id, newsletter_opt_in")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle()

      if (qErr) throw qErr
      if (!data) {
        setStatus("not_found")
        return
      }
      setProfileId(data.id)
      setOptIn(data.newsletter_opt_in ?? false)
      setStatus("found")
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profileId) return
    setLoading(true)
    setError(null)
    try {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ newsletter_opt_in: optIn })
        .eq("id", profileId)
      if (upErr) throw upErr
      setStatus("saved")
    } catch (err: any) {
      setError(err.message || "Failed to save preferences.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-24">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo-primary.png"
              alt="Ausaguide"
              width={160}
              height={32}
              className="h-10 w-auto block object-contain"
            />
          </Link>
          <p className="text-sm text-muted-foreground text-center">
            Manage your email preferences
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl p-6 shadow-[var(--shadow-3)] space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-foreground">Email Preferences</h1>
            <p className="text-xs text-muted-foreground">
              Control which emails you receive from Ausaguide.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive animate-in fade-in">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {status === "saved" ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center animate-in fade-in zoom-in-95">
              <div className="rounded-full bg-[#2CB67D]/15 p-4">
                <CheckCircle2 className="size-10 text-[#2CB67D]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Preferences Saved!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {optIn
                    ? "You're subscribed to Ausaguide updates and newsletters."
                    : "You've unsubscribed from Ausaguide newsletters."}
                </p>
              </div>
              <Link
                to="/"
                className="text-xs text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          ) : status === "not_found" ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-semibold text-amber-400 animate-in fade-in">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>No account found with that email address.</span>
              </div>
              <button
                onClick={() => { setStatus("idle"); setEmail("") }}
                className="w-full text-xs text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
              >
                Try a different email
              </button>
            </div>
          ) : status === "found" ? (
            <div className="space-y-4 animate-in fade-in">
              <p className="text-xs text-muted-foreground text-center">
                Account found for <span className="text-foreground font-semibold">{email}</span>
              </p>

              <div className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-4">
                {/* Newsletter Toggle */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-9 rounded-full flex items-center justify-center ${optIn ? "bg-[#7F5AF0]/15" : "bg-white/5"}`}>
                      {optIn ? (
                        <Bell className="size-4 text-[#7F5AF0]" />
                      ) : (
                        <BellOff className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Newsletter & Updates</p>
                      <p className="text-[11px] text-muted-foreground">
                        New tours, features, and Ausaguide news
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={optIn}
                    onClick={() => setOptIn((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      optIn ? "bg-[#7F5AF0]" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-lg transform transition-transform duration-200 ${
                        optIn ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="h-px bg-border/40" />

                {/* Transactional (always on) */}
                <div className="flex items-center justify-between gap-4 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full flex items-center justify-center bg-[#2CB67D]/15">
                      <Mail className="size-4 text-[#2CB67D]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Booking Confirmations</p>
                      <p className="text-[11px] text-muted-foreground">
                        Receipts, reminders, host messages
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#2CB67D] bg-[#2CB67D]/10 px-2 py-0.5 rounded-full">
                    Always On
                  </span>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white text-sm font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="size-4 animate-spin" />Saving...</>
                ) : (
                  "Save Preferences"
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleLookup} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="pref-email">
                  Your Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="pref-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border/80 bg-background/60 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white text-sm font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="size-4 animate-spin" />Looking up...</>
                ) : (
                  "Manage My Preferences"
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          You can also manage preferences in{" "}
          <Link to="/settings" className="text-primary hover:text-primary/80 underline underline-offset-2">
            Account Settings
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
