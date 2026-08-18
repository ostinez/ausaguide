import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowRight, Users, Shield, Sparkles, CheckCircle, Mail, User, Globe, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { checkRateLimit } from "@/lib/api/rate-limit"
import { sendGeneralWaitlistEmail } from "@/lib/api/emails"
import { trackEvent } from "@/lib/posthog"
import { useSEO } from "@/hooks/useSEO"

export default function WaitlistPage() {
  useSEO({
    title: "Get Early Access | Ausaguide Kenya",
    description: "Join thousands of travelers and locals waiting to explore Kenya smarter. Get early access, exclusive tour rates, and zero hidden fees.",
    url: "https://ausaguide.com/waitlist",
  })

  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"traveler" | "host" | "both">("traveler")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !role) {
      toast.error("Please fill in your name, email, and choose your role.")
      return
    }

    setLoading(true)

    // Rate limiting check
    let ipAddress = "client"
    try {
      const res = await fetch("https://api.ipify.org?format=json")
      if (res.ok) {
        const data = await res.json()
        if (data?.ip) ipAddress = data.ip
      }
    } catch {
      // fallback
    }

    try {
      const rateLimitKey = `waitlist:${ipAddress}`
      const limitResult = await checkRateLimit(rateLimitKey, { max: 5, windowMs: 60 * 60 * 1000 })
      if (!limitResult.allowed) {
        toast.error("Too many requests. Please try again in an hour.")
        setLoading(false)
        return
      }
    } catch (limitErr) {
      console.warn("Rate limit check notice:", limitErr)
    }

    try {
      const { error } = await supabase.from("waitlist").insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role,
        interest: ["general-launch", `role:${role}`],
      })

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already on the waitlist! We'll notify you as soon as we launch.")
          setSubmitted(true)
          return
        }
        throw error
      }

      sendGeneralWaitlistEmail(email.trim(), name.trim(), role).catch((mailErr) =>
        console.warn("[Waitlist] Mail error:", mailErr)
      )

      trackEvent("waitlist_joined", {
        name: name.trim(),
        email: email.trim(),
        role,
      })

      setSubmitted(true)
      toast.success("You have been added to the early access waitlist!")
    } catch (err: any) {
      console.error("[Waitlist] Error:", err)
      toast.error(err.message || "Failed to join waitlist. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1e293b] rounded-3xl p-8 sm:p-10 text-center border border-[#334155] shadow-2xl space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="size-16 sm:size-20 bg-blue-500/20 border border-blue-500/40 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="size-8 sm:size-10 text-blue-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-headline">
              You're on the list!
            </h2>
            <p className="text-[#cbd5e1] text-sm sm:text-base leading-relaxed">
              Welcome to the Ausaguide community, <strong className="text-white">{name.split(" ")[0]}</strong>. You'll be the first to know when we launch early access.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0f172a] border border-[#334155] text-xs text-[#94a3b8] text-left space-y-2">
            <div className="flex items-center gap-2 text-[#cbd5e1] font-semibold">
              <Sparkles className="size-4 text-blue-400" />
              <span>What to expect next:</span>
            </div>
            <p>1. Priority invitation to beta test live video tours.</p>
            <p>2. Exclusive 20% discount code on your first guided journey.</p>
            <p>3. Direct introduction to verified Kenyan local hosts.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
            >
              Back to Home
            </button>
            <Link
              to="/tours"
              className="w-full py-3 px-6 bg-[#0f172a] hover:bg-[#1e293b] text-[#cbd5e1] border border-[#334155] font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Explore Tours</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      {/* NAVBAR */}
      <nav className="border-b border-[#334155] bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-colors">
              <Globe className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-headline">Ausaguide</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/tours" className="text-[#94a3b8] hover:text-white text-sm font-medium transition-colors hidden sm:inline-flex">
              Explore Tours
            </Link>
            <Link
              to="/auth"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-[#cbd5e1] hover:text-white bg-[#1e293b] hover:bg-[#334155] border border-[#334155] transition-all"
            >
              Log in
            </Link>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 md:py-20 flex flex-col justify-center">
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs sm:text-sm font-semibold">
            <Sparkles className="size-4" />
            <span>The Future of Travel in Kenya</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.15] font-headline">
            Get Early Access to Ausaguide
          </h1>
          <p className="text-[#94a3b8] text-base md:text-lg max-w-lg mx-auto leading-relaxed">
            Join thousands of travelers and locals waiting to explore Kenya smarter.
          </p>
        </div>

        {/* FORM */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs sm:text-sm text-[#cbd5e1] font-semibold block mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-white placeholder:text-[#94a3b8]/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm text-[#cbd5e1] font-semibold block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-white placeholder:text-[#94a3b8]/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs sm:text-sm text-[#cbd5e1] font-semibold block mb-2">
                I am joining as
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "traveler", label: "Traveler" },
                  { id: "host", label: "Local Host" },
                  { id: "both", label: "Both" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setRole(option.id as any)}
                    disabled={loading}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer min-h-[44px] ${
                      role === option.id
                        ? "bg-blue-500 text-white shadow-lg ring-2 ring-blue-300"
                        : "bg-[#0f172a] text-[#94a3b8] border border-[#334155] hover:bg-[#1e293b] hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-[#334155]/60">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#cbd5e1]">
                <Shield className="size-4 text-blue-400 shrink-0" />
                <span>Early access</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#cbd5e1]">
                <Sparkles className="size-4 text-blue-400 shrink-0" />
                <span>Exclusive rates</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#cbd5e1]">
                <CheckCircle className="size-4 text-blue-400 shrink-0" />
                <span>No hidden fees</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim() || !role}
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-800/50 text-white font-bold rounded-xl text-base transition-all duration-200 flex items-center justify-center gap-2 min-h-[56px] shadow-lg cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>Joining Waitlist...</span>
                </>
              ) : (
                <>
                  <span>Join the Waitlist</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-[#94a3b8] text-xs sm:text-sm flex items-center justify-center gap-2">
            <Users className="size-4 text-blue-400" />
            <span>Join hundreds of travelers and local guides ready for launch</span>
          </p>
        </div>
      </main>
    </div>
  )
}
