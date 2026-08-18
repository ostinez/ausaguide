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
      <section id="waitlist" className="relative min-h-[500px] flex items-center justify-center text-center px-4 py-20 bg-[#0f172a] overflow-hidden border-b border-[#334155]">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-md mx-auto space-y-5 animate-in fade-in zoom-in duration-300">
          <div className="size-16 bg-blue-500/20 border border-blue-500/40 rounded-full flex items-center justify-center mx-auto text-blue-400 shadow-xl">
            <CheckCircle2 className="size-8 animate-pulse" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-headline">
            You're on the list!
          </h2>
          <p className="text-[#cbd5e1] text-sm sm:text-base leading-relaxed font-body">
            Welcome to the community. You'll be the first to receive early access and launch privileges.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      id="waitlist"
      className="relative min-h-[750px] flex items-center overflow-hidden bg-[#0f172a] py-20 px-4 sm:px-6 lg:px-8 border-b border-[#334155] select-none"
    >
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <div className="absolute top-12 left-10 w-72 h-72 bg-blue-600 rounded-full blur-[100px]" />
        <div className="absolute bottom-12 right-10 w-96 h-96 bg-blue-700 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[140px]" />
      </div>

      <div className="relative max-w-4xl mx-auto w-full text-center space-y-8 z-10">
        {/* Top Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-200 text-xs font-bold tracking-wide uppercase shadow-sm">
            <Sparkles className="size-3.5 text-blue-400" />
            The Future of Travel
          </span>
        </div>

        {/* Main Headline */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight font-headline">
          Stop Wasting Money{" "}
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-blue-400 via-teal-400 to-[#80e5e9] bg-clip-text text-transparent">
            on Tourist Traps.
          </span>
        </h2>

        {/* Sub-headline */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-[#cbd5e1] leading-relaxed font-body">
          Explore Kenya through a local's eyes before you book.
          <br className="hidden sm:block" />
          Connect with vetted hosts for live reconnaissance tours — all from your phone.
        </p>

        {/* Form Container */}
        <div className="max-w-xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-[#334155] bg-[#1e293b]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-4 text-left"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#cbd5e1]">
                  Your Name (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-3.5 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-white placeholder:text-[#94a3b8]/60 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs font-medium min-h-[44px]"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#cbd5e1]">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-3.5 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-white placeholder:text-[#94a3b8]/60 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs font-medium min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#cbd5e1]">
                I want to join as:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "traveler", label: "Traveler" },
                  { id: "host", label: "Local Host" },
                  { id: "both", label: "Both" },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as any)}
                    disabled={loading}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[40px] flex items-center justify-center ${
                      role === r.id
                        ? "border-blue-400 bg-blue-600 text-white shadow-md shadow-blue-900/50"
                        : "border-[#334155] bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b] hover:text-white"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-xl shadow-blue-950/60 border border-blue-400/30 cursor-pointer min-h-[48px] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Reserving Your Spot...</span>
                  </>
                ) : (
                  <>
                    <span>Join the Waitlist</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>

            <div className="pt-1">
              <p className="text-[11px] text-center text-[#94a3b8] font-medium">
                100% Free • No spam • Unsubscribe anytime
              </p>
            </div>
          </form>
        </div>

        {/* Benefits Badges */}
        <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-4 sm:gap-8 text-xs font-semibold text-[#cbd5e1] pt-2">
          <div className="flex items-center gap-1.5">
            <Shield className="size-4 text-blue-400" />
            <span>Early Access Privileges</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="size-4 text-blue-400" />
            <span>Direct Guide Community</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-blue-400" />
            <span>Exclusive Launch Discounts</span>
          </div>
        </div>

        {/* Social Proof */}
        <div className="max-w-md mx-auto pt-6 border-t border-[#334155] text-center space-y-2">
          <p className="text-xs text-[#94a3b8] font-medium">
            Join 1,200+ travelers & local Kenyan guides ready for takeoff
          </p>
          <div className="flex justify-center items-center gap-1 text-[11px] text-[#cbd5e1]">
            <span className="text-blue-400 font-bold">●</span>
            <span>Beta opening soon across Nairobi, Mombasa & Maasai Mara</span>
            <span className="text-blue-400 font-bold">●</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WaitlistHero
