import { useState } from "react"
import { HeroGlobe } from "@/components/landing/hero-globe"
import { ToursPreview } from "@/components/landing/tours-preview"
import { DiscoverToursStack } from "@/components/landing/discover-tours-stack"
import { HowItWorks } from "@/components/landing/how-it-works"
import { ImpactPreview } from "@/components/landing/impact-preview"
import { CTASection } from "@/components/landing/cta-section"
import { useSEO } from "@/hooks/useSEO"
import { JsonLd } from "@/components/seo/JsonLd"
import ProfileCard from "@/components/ui/ProfileCard"
import founderPhoto from "../assets/images/founder/austin-mbote.jpg"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { sendGeneralWaitlistEmail } from "@/lib/api/emails"
import { checkRateLimit } from "@/lib/api/rate-limit"
import { Sparkles, User, Mail, Loader2, CheckCircle2 } from "lucide-react"

export default function Home() {
  useSEO({
    title: "Live tours with real locals in Kenya",
    description:
      "Ausaguide connects you with authentic local guides for unforgettable experiences across Kenya. Book private safaris, cultural walks, and city tours.",
  })

  const [waitlistName, setWaitlistName] = useState("")
  const [waitlistEmail, setWaitlistEmail] = useState("")
  const [waitlistRole, setWaitlistRole] = useState<"traveler" | "host" | "both">("traveler")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!waitlistName.trim() || !waitlistEmail.trim()) {
      toast.error("Please fill in Name and Email.")
      return
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
      const { error } = await supabase
        .from("waitlist")
        .insert({
          name: waitlistName.trim(),
          email: waitlistEmail.trim(),
          role: waitlistRole,
        })

      if (error) {
        if (error.code === "23505") {
          toast.info("You've already signed up with this email! Thank you.")
          setSuccess(true)
          return
        }
        throw error
      }

      await sendGeneralWaitlistEmail(waitlistEmail.trim(), waitlistName.trim(), waitlistRole)
      toast.success("Welcome to the waitlist!")
      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative overflow-hidden min-h-screen bg-background">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          "name": "Ausaguide",
          "url": "https://ausaguide.com",
          "description": "See destinations live before you book. Connect with real locals in Kenya for unfiltered virtual tours.",
          "image": "https://ausaguide.com/og-image.png",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "KE"
          }
        }}
      />
      <div className="dark-section">
        <HeroGlobe />
      </div>

      {/* Homepage Waitlist Section */}
      <section className="bg-[#16161A] py-16 px-6 border-b border-white/5 relative overflow-hidden flex flex-col items-center">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7F5AF0]/10 border border-[#7F5AF0]/20 text-xs font-semibold text-[#7F5AF0] mb-2">
              <Sparkles className="size-3.5" />
              <span>Launch day waiting list</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Be the First to Explore</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              Join the waitlist and get early access when we launch.
            </p>
          </div>

          {success ? (
            <div className="rounded-2xl border border-white/10 p-8 backdrop-blur-xl bg-card/40 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-teal/10 border border-teal/20 text-[#2CB67D]">
                <CheckCircle2 className="size-6 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white">🎉 You're on the list!</h3>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
                We'll notify you when we launch early access. Thank you for your support!
              </p>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="rounded-2xl border border-white/10 p-6 sm:p-8 backdrop-blur-xl bg-card/20 shadow-2xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                    <input
                      type="text"
                      required
                      value={waitlistName}
                      onChange={(e) => setWaitlistName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-[#121214]/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#7F5AF0] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                    <input
                      type="email"
                      required
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-[#121214]/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#7F5AF0] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">I am joining as a: *</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["traveler", "host", "both"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setWaitlistRole(r)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        waitlistRole === r
                          ? "border-[#7F5AF0] bg-[#7F5AF0]/10 text-white"
                          : "border-white/10 bg-[#121214]/40 text-white/60 hover:border-white/20"
                      }`}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white text-xs font-bold shadow-lg hover:shadow-[0_4px_16px_rgba(127,90,240,0.3)] disabled:opacity-50 transition duration-300 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Joining Waitlist...</span>
                  </>
                ) : (
                  <span>Join the Waitlist</span>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      <ToursPreview />
      <DiscoverToursStack />
      <HowItWorks />
      <ImpactPreview />
      <CTASection />

      {/* Founder Section */}
      <section className="bg-[#16161A] py-20 px-6 border-t border-white/5 relative overflow-hidden flex flex-col items-center">
        {/* Subtle background effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Meet the Founder</h2>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">Built for connection, powered by people</p>
        </div>
        
        <div className="flex justify-center w-full max-w-sm relative z-10">
          <ProfileCard
            name="Austin M. Mbote"
            title="Founder & Lead Developer"
            status="Building connections 🌍"
            contactText="Let's Connect"
            avatarUrl={founderPhoto}
            showUserInfo={true}
            enableTilt={true}
            enableMobileTilt={true}
            behindGlowEnabled={true}
            behindGlowColor="rgba(127, 90, 240, 0.4)"
            innerGradient="linear-gradient(145deg, rgba(127, 90, 240, 0.2), rgba(44, 182, 125, 0.1))"
            onContactClick={() => window.open('https://www.linkedin.com/in/austin-murithi-5343aa402', '_blank')}
            onAvatarClick={() => window.location.href = '/about#founder-story'}
          />
        </div>
      </section>
    </div>
  )
}
