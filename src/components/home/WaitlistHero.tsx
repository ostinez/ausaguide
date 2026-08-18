import { useState } from "react"
import { ArrowRight, Mail, Shield, Users, Sparkles, CheckCircle2, User, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { sendGeneralWaitlistEmail } from "@/lib/api/emails"
import { checkRateLimit } from "@/lib/api/rate-limit"

export function WaitlistHero() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"traveler" | "host" | "both">("traveler")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error("Please enter your email address.")
      return
    }

    setLoading(true)

    // Rate limit check: max 3 waitlist submissions per hour per IP
    let ipAddress = "local"
    try {
      const res = await fetch("https://api.ipify.org?format=json")
      if (res.ok) {
        const data = await res.json()
        if (data?.ip) ipAddress = data.ip
      }
    } catch (err) {
      console.warn("IP check fallback:", err)
    }

    try {
      const rateLimitKey = `waitlist:${ipAddress}`
      const limitResult = await checkRateLimit(rateLimitKey, { max: 3, windowMs: 60 * 60 * 1000 })
      if (!limitResult.allowed) {
        toast.error("Too many attempts. Please try again in an hour.")
        setLoading(false)
        return
      }
    } catch (limitErr) {
      console.error("Rate check bypass:", limitErr)
    }

    try {
      const { error } = await supabase.from("waitlist").insert({
        name: name.trim() || null,
        email: email.trim().toLowerCase(),
        role: role,
      })

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already on the waitlist! We'll keep you posted.")
          setSubmitted(true)
          return
        }
        throw error
      }

      await sendGeneralWaitlistEmail(email.trim(), name.trim() || "Traveler", role)
      toast.success("Welcome to the waitlist!")
      setSubmitted(true)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to join waitlist. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <section id="waitlist" className="relative min-h-[500px] flex items-center justify-center text-center px-4 py-20 bg-gradient-to-br from-[#0f0a1a] via-[#1a1030] to-[#0f0a1a] overflow-hidden border-b border-purple-900/30">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-md mx-auto space-y-5 animate-in fade-in zoom-in duration-300">
          <div className="size-16 bg-purple-500/20 border border-purple-500/40 rounded-full flex items-center justify-center mx-auto text-purple-400 shadow-xl">
            <CheckCircle2 className="size-8 animate-pulse" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-headline">
            You're on the list!
          </h2>
          <p className="text-purple-200 text-sm sm:text-base leading-relaxed font-body">
            Welcome to the community. You'll be the first to receive early access and launch privileges.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      id="waitlist"
      className="relative min-h-[750px] flex items-center overflow-hidden bg-gradient-to-br from-[#0f0a1a] via-[#1a1030] to-[#0f0a1a] py-20 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30 select-none"
    >
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <div className="absolute top-12 left-10 w-72 h-72 bg-purple-600 rounded-full blur-[100px]" />
        <div className="absolute bottom-12 right-10 w-96 h-96 bg-purple-700 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[140px]" />
      </div>

      <div className="relative max-w-4xl mx-auto w-full text-center space-y-8 z-10">
        {/* Top Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-400/30 bg-purple-500/10 text-purple-200 text-xs font-bold tracking-wide uppercase shadow-sm">
            <Sparkles className="size-3.5 text-purple-400" />
            The Future of Travel
          </span>
        </div>

        {/* Main Headline */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight font-headline">
          Stop Wasting Money{" "}
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-[#80e5e9] bg-clip-text text-transparent">
            on Tourist Traps.
          </span>
        </h2>

        {/* Sub-headline */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-purple-200/90 leading-relaxed font-body">
          Explore Kenya through a local's eyes before you book.
          <br className="hidden sm:block" />
          Connect with vetted hosts for live reconnaissance tours — all from your phone.
        </p>

        {/* Waitlist Form */}
        <div className="max-w-xl mx-auto w-full pt-2">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-purple-500/30 bg-purple-950/40 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-4 text-left"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-purple-200/80">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-purple-400/70" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-10 pr-3.5 py-3 bg-white/5 border border-purple-500/25 rounded-xl text-white placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs font-medium min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-purple-200/80">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-purple-400/70" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3.5 py-3 bg-white/5 border border-purple-500/25 rounded-xl text-white placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs font-medium min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-purple-200/80">
                I am joining as: *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["traveler", "host", "both"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer min-h-[40px] ${
                      role === r
                        ? "border-purple-400 bg-purple-600 text-white shadow-md shadow-purple-900/50"
                        : "border-purple-500/20 bg-white/5 text-purple-200 hover:bg-white/10"
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-[#7c3aed] to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-xl shadow-purple-950/60 border border-purple-400/30 cursor-pointer min-h-[48px] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Joining Waitlist...</span>
                  </>
                ) : (
                  <>
                    <span>Join the Waitlist</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-purple-300/70 font-medium">
                Get early access and exclusive launch discounts
              </p>
            </div>
          </form>
        </div>

        {/* Trust Indicators */}
        <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-4 sm:gap-8 text-xs font-semibold text-purple-200/90 pt-2">
          <span className="flex items-center gap-1.5">
            <Shield className="size-4 text-purple-400" />
            Early access privileges
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4 text-purple-400" />
            Exclusive member rates
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-purple-400" />
            Zero hidden booking fees
          </span>
        </div>

        {/* Social Proof */}
        <div className="max-w-md mx-auto pt-6 border-t border-purple-500/20 text-center space-y-2">
          <p className="text-xs text-purple-300/70 font-medium">
            Join hundreds of travelers and local guides ready for launch
          </p>
          <div className="flex justify-center items-center gap-1 text-[11px] text-purple-300/80">
            <span className="text-purple-400 font-bold">◆</span>
            <span>Verified Kenya Community</span>
            <span className="text-purple-400 font-bold">◆</span>
          </div>
        </div>
      </div>
    </section>
  )
}
