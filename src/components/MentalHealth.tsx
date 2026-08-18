import { useState } from "react"
import { Heart, Shield, Brain, Flower2, Users, ArrowRight, Check, ShieldCheck, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { trackEvent } from "@/lib/posthog"
import { sendMentalHealthConfirmationEmail } from "@/lib/api/emails"
import { cn } from "@/lib/utils"

export interface MentalHealthProps {
  onComplete?: () => void
  className?: string
}

export function MentalHealth({ onComplete, className }: MentalHealthProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"traveler" | "host" | "both">("traveler")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const roleOptions: Array<{ id: "traveler" | "host" | "both"; label: string }> = [
    { id: "traveler", label: "Traveler" },
    { id: "host", label: "Local Host" },
    { id: "both", label: "Both" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !role) {
      toast.error("Please enter your name, email, and choose your role.")
      return
    }

    setLoading(true)
    try {
      const userId = localStorage.getItem("user_id")

      // 1. Persist to Supabase waitlist / social impact tables
      const { error: dbError } = await supabase.from("waitlist").insert({
        email: email.trim(),
        name: name.trim(),
        interest: ["mental-health", `role:${role}`],
      })

      if (dbError && dbError.code !== "23505") {
        console.warn("[MentalHealth] Database notice:", dbError)
      }

      // Also record in travel_commitments if table exists
      try {
        const randomNum = Math.floor(1000 + Math.random() * 9000)
        const commitmentId = `AUS-WELL-${randomNum}`
        await supabase.from("travel_commitments").insert({
          user_id: userId || null,
          email: email.trim(),
          name: name.trim(),
          dedication: `Mental Health Support (${role})`,
          commitment_id: commitmentId,
          status: "pending",
        })
      } catch (err) {
        console.warn("[MentalHealth] Commitment fallback:", err)
      }

      // 2. Send automated confirmation email
      sendMentalHealthConfirmationEmail(email.trim(), name.trim(), role).catch((mailErr) =>
        console.warn("[MentalHealth] Mail notice:", mailErr)
      )

      // 3. Track with PostHog
      trackEvent("mental_health_pledge", {
        name: name.trim(),
        email: email.trim(),
        role,
      })

      setSubmitted(true)
      toast.success("Thank you for joining the Mental Health & Guide Wellness movement!")

      if (onComplete) onComplete()
    } catch (err: any) {
      console.error("[MentalHealth] Submission error:", err)
      toast.error(err.message || "Failed to join movement. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSubmitted(false)
    setName("")
    setEmail("")
    setRole("traveler")
  }

  if (submitted) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-[#0a1628] to-[#1a2a4a] rounded-3xl p-8 md:p-12 text-center border border-blue-700/40 shadow-2xl text-white relative overflow-hidden",
          className
        )}
      >
        <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
          <Shield className="size-64 text-blue-400" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto space-y-5">
          <div className="size-16 md:size-20 bg-blue-500/20 border border-blue-400/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Check className="size-8 md:size-10 text-blue-400" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Heart className="size-3.5 fill-current" />
              <span>Movement Joined</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white font-headline">
              Thank You, {name.split(" ")[0]}!
            </h3>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed">
              You're helping make travel safer, more mindful, and supportive. Every booking on Ausaguide helps fund mental health resources for local guides and travelers in Kenya.
            </p>
          </div>

          <p className="text-blue-300/80 text-xs font-medium">
            Join 500+ travelers and hosts supporting mental health and guide burnout recovery.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-3 border border-blue-500/50 text-blue-200 hover:text-white rounded-xl hover:bg-blue-500/20 transition-all font-semibold text-sm cursor-pointer min-h-[44px]"
            >
              Support Again
            </button>
            <a
              href="/mental-health"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-bold text-sm shadow-md flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <span>Explore Initiative</span>
              <ArrowRight className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section
      className={cn(
        "bg-gradient-to-br from-[#0a1628] to-[#1a2a4a] rounded-3xl p-6 sm:p-8 md:p-12 border border-blue-800/40 relative overflow-hidden shadow-2xl text-white",
        className
      )}
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
        <Shield className="size-64 md:size-80 text-blue-400" />
      </div>
      <div className="absolute bottom-0 left-0 opacity-5 pointer-events-none">
        <Flower2 className="size-48 md:size-64 text-blue-400" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 text-blue-400 text-xs sm:text-sm font-semibold mb-3">
          <Heart className="size-4 fill-current" />
          <span className="uppercase tracking-wider">Social Impact</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white font-headline tracking-tight leading-tight">
          Travel Mindfully, Support Mental Health
        </h2>

        <p className="text-blue-200 text-sm sm:text-base md:text-lg mt-2.5 max-w-2xl leading-relaxed font-normal">
          Every booking helps provide mental health resources for travelers and locals across Kenya.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-5 text-xs sm:text-sm">
          <span className="flex items-center gap-2 text-blue-200 bg-white/[0.06] border border-blue-700/30 px-3 py-1.5 rounded-full">
            <Users className="size-4 text-blue-400" />
            <strong className="text-white font-bold">500+</strong> supporters
          </span>
          <span className="flex items-center gap-2 text-blue-200 bg-white/[0.06] border border-blue-700/30 px-3 py-1.5 rounded-full">
            <Brain className="size-4 text-blue-400" />
            <span>Mental health resources available</span>
          </span>
          <span className="hidden sm:flex items-center gap-2 text-blue-200 bg-white/[0.06] border border-blue-700/30 px-3 py-1.5 rounded-full">
            <ShieldCheck className="size-4 text-blue-400" />
            <span>Guide Wellness Support</span>
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-xl mt-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs sm:text-sm text-blue-100 font-semibold block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                disabled={loading}
                className="mental-health-input w-full px-4 py-3 rounded-xl text-white placeholder:text-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm text-blue-100 font-semibold block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
                className="mental-health-input w-full px-4 py-3 rounded-xl text-white placeholder:text-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm sm:text-base"
              />
            </div>
          </div>

          <div>
            <label className="text-xs sm:text-sm text-blue-100 font-semibold block mb-2">
              I want to join as
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {roleOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRole(opt.id)}
                  disabled={loading}
                  className={cn(
                    "role-selector-btn h-11 sm:h-12 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center cursor-pointer min-h-[44px]",
                    role === opt.id
                      ? "bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 scale-102"
                      : "bg-white/10 text-blue-100 hover:bg-white/20 border border-blue-700/40"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim() || !role}
            className="w-full min-h-[56px] py-3.5 mental-health-button text-white font-bold rounded-xl text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-xl hover:shadow-blue-900/40 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Joining Movement...</span>
              </>
            ) : (
              <>
                <span>Join the Mental Health Movement</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        {/* Trust badge */}
        <div className="flex items-center gap-2 text-blue-300/80 text-xs mt-5 pt-2">
          <Heart className="size-4 text-blue-400 shrink-0 fill-current" />
          <span>100% of proceeds go to mental health resources for travelers and locals</span>
        </div>
      </div>
    </section>
  )
}
