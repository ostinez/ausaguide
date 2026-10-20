import { useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  CheckCircle,
  Mail,
  ShieldCheck,
  Compass,
  Video,
  Users,
  Sparkles,
  MapPin,
  ChevronDown,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Camera,
  Globe,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useSEO } from "@/hooks/useSEO"
import { trackEvent } from "@/lib/posthog"

export default function WaitlistPage() {
  useSEO({
    title: "Join the Waitlist — See Nairobi Live Before You Go | Ausaguide",
    description:
      "Our vision is a world where anyone can travel to a new place and feel like a local—before they even leave home. Join the waitlist for early access to live Nairobi tours.",
    url: "https://ausaguide.com/waitlist",
    image: "https://ausaguide.com/images/home/nairobi_skyline.jpg",
  })

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  // Validate email format
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value.trim())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.")
      return
    }

    if (!validateEmail(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.")
      return
    }

    setLoading(true)

    try {
      // Insert into Supabase table `waitlist`
      // Columns: id (uuid), email (text), role (text), created_at (timestamp)
      const { error } = await supabase.from("waitlist").insert({
        email: trimmedEmail,
        role: "traveler",
      })

      if (error) {
        // Handle duplicate unique constraint violation (Postgres error code 23505)
        const isDuplicate =
          error.code === "23505" ||
          error.message?.toLowerCase().includes("duplicate") ||
          error.message?.toLowerCase().includes("unique") ||
          error.message?.toLowerCase().includes("already exists")

        if (isDuplicate) {
          setErrorMessage("This email is already on our waitlist. We'll be in touch soon!")
          setLoading(false)
          return
        }

        // Schema fallback attempt if extra columns or permissions differ
        const { error: fallbackError } = await supabase.from("waitlist").insert([
          { email: trimmedEmail }
        ])

        if (fallbackError) {
          const isFallbackDuplicate =
            fallbackError.code === "23505" ||
            fallbackError.message?.toLowerCase().includes("duplicate") ||
            fallbackError.message?.toLowerCase().includes("unique")

          if (isFallbackDuplicate) {
            setErrorMessage("This email is already on our waitlist. We'll be in touch soon!")
            setLoading(false)
            return
          }

          throw fallbackError
        }
      }

      // Track PostHog event
      try {
        trackEvent("waitlist_joined", {
          email: trimmedEmail,
          page: "waitlist_nairobi",
          source: "dedicated_waitlist_page",
        })
      } catch {
        // Silent analytics fallback
      }

      setSubmitted(true)
      toast.success("You're on the list! Welcome to Ausaguide.")
    } catch (err: any) {
      console.error("[Waitlist Submit Error]:", err)
      setErrorMessage(
        err.message || "Failed to join the waitlist. Please check your internet connection and try again."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://ausaguide.com/waitlist")
    setCopiedLink(true)
    toast.success("Waitlist link copied to clipboard!")
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const faqItems = [
    {
      q: "What is Ausaguide Nairobi Live?",
      a: "Ausaguide connects travelers with verified local Nairobi residents for real-time, unfiltered interactive video tours. You get to walk the streets, inspect neighborhoods, check weather, and talk with locals before booking flights or accommodations.",
    },
    {
      q: "Why are payments temporarily paused?",
      a: "We are currently completing regulatory and local payment compliance to ensure 100% secure, seamless transactions and full host escrow protection. During this brief period, we are accepting early access signups on our waitlist.",
    },
    {
      q: "Is joining the waitlist free?",
      a: "Yes, joining the waitlist is 100% free. Early waitlist members receive priority invitations to our beta sessions, exclusive 20% discount codes, and direct access to top-rated Nairobi hosts.",
    },
    {
      q: "When will I get access?",
      a: "We are rolling out early invitations in small cohorts to ensure high video streaming quality and attentive guide interaction. You'll receive an email as soon as your batch is ready.",
    },
    {
      q: "Can I also sign up as a local Nairobi host?",
      a: "Yes! If you are a resident in Nairobi with local knowledge, passion for your city, and a smartphone, you can sign up to share your neighborhood and earn an income.",
    },
  ]

  const previewCards = [
    {
      title: "Westlands Rooftops & Dining",
      location: "Westlands, Nairobi",
      tag: "Nightlife & Cuisine",
      desc: "Scout evening dining spots, lively lounges, and safety conditions with a local before heading out.",
      image: "/images/tours/street_food.webp",
      badge: "Live Micro-Tour",
    },
    {
      title: "Karura Forest & Secret Waterfalls",
      location: "Limuru Road, Nairobi",
      tag: "Nature & Hiking",
      desc: "Check trail mud levels, morning visibility, and quiet picnic clearings with resident guides.",
      image: "/images/corridor/smart_safari_guide.jpg",
      badge: "Trail Recon",
    },
    {
      title: "Maasai Market Artisan Walk",
      location: "City Center, Nairobi",
      tag: "Culture & Art",
      desc: "Learn fair craft pricing, see beadwork in real time, and avoid aggressive tout markups.",
      image: "/images/home/cta_coast.webp",
      badge: "Verified Local",
    },
  ]

  return (
    <div className="min-h-screen bg-[#113B3A] text-[#FDFBF7] flex flex-col selection:bg-[#E07A5F] selection:text-white">
      {/* ── Top Brand Header ── */}
      <header className="border-b border-[#235E5D]/60 bg-[#113B3A]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-[#184948] text-[#B7E6E5] border border-[#235E5D] group-hover:bg-[#235E5D] transition-colors shadow-sm">
              <Globe className="size-5 text-[#B7E6E5]" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-[#FDFBF7] font-headline">
                Ausaguide
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#184948] text-[#E07A5F] border border-[#235E5D]">
                Nairobi Edition
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs sm:text-sm font-semibold text-[#B7E6E5] hover:text-[#FDFBF7] px-3 py-1.5 rounded-lg hover:bg-[#184948] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <main className="flex-1 flex flex-col">
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Subtle Ambient Background Gradient Lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#317978]/25 via-[#E07A5F]/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute -top-10 right-10 w-[350px] h-[350px] bg-[#E07A5F]/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
            {/* Early Access Status Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#184948]/90 border border-[#235E5D] shadow-neo-pill backdrop-blur-md">
              <span className="flex size-2 rounded-full bg-[#E07A5F] animate-ping" />
              <span className="size-2 rounded-full bg-[#E07A5F] -ml-4" />
              <Sparkles className="size-3.5 text-[#E07A5F]" />
              <span className="text-xs sm:text-sm font-bold text-[#FDFBF7] tracking-wide">
                Early Access Waitlist · Nairobi Pilot
              </span>
            </div>

            {/* Prominent Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#FDFBF7] tracking-tight leading-[1.1] font-headline max-w-3xl mx-auto">
              See Nairobi Live{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FDFBF7] via-[#B7E6E5] to-[#E07A5F]">
                Before You Go.
              </span>
            </h1>

            {/* Subheadline Incorporating Vision */}
            <p className="text-base sm:text-lg md:text-xl text-[#B7E6E5]/90 max-w-2xl mx-auto leading-relaxed font-normal">
              Our vision is a world where anyone can travel to a new place and feel like a local—before they even leave home. Join the waitlist for early access.
            </p>

            {/* ── Waitlist Form or Success State Card ── */}
            <div className="max-w-xl mx-auto pt-2">
              {!submitted ? (
                <div className="bg-[#184948] border border-[#235E5D] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
                  {/* Subtle Top Border Glow */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#E07A5F] to-transparent opacity-80" />

                  <form noValidate onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2 text-left">
                      <label
                        htmlFor="waitlist-email"
                        className="text-xs sm:text-sm font-bold text-[#FDFBF7] flex items-center gap-2"
                      >
                        <Mail className="size-4 text-[#E07A5F]" />
                        <span>Reserve your priority invitation</span>
                      </label>
                      <div className="relative">
                        <input
                          id="waitlist-email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value)
                            if (errorMessage) setErrorMessage(null)
                          }}
                          placeholder="Enter your email address"
                          disabled={loading}
                          aria-label="Email Address"
                          className="w-full px-4 py-3.5 sm:py-4 bg-[#113B3A] border border-[#235E5D] focus:border-[#E07A5F] focus:ring-2 focus:ring-[#E07A5F]/30 rounded-2xl text-[#FDFBF7] placeholder:text-[#599D9C] text-sm sm:text-base outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Red Text Error Message (Task 2) */}
                    {errorMessage && (
                      <div
                        role="alert"
                        className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 flex items-start gap-2.5 text-left text-xs sm:text-sm text-red-200 animate-in fade-in duration-200"
                      >
                        <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
                        <span className="font-medium">{errorMessage}</span>
                      </div>
                    )}

                    {/* Large Warm Orange Button (Task 1 & Task 2) */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 px-6 bg-[#E07A5F] hover:bg-[#d46549] active:scale-[0.99] disabled:bg-[#184948] disabled:border-[#235E5D] text-white font-extrabold text-base rounded-2xl transition-all duration-200 shadow-lg shadow-[#E07A5F]/30 hover:shadow-[#E07A5F]/50 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed min-h-[56px]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="size-5 animate-spin text-white" />
                          <span>Joining...</span>
                        </>
                      ) : (
                        <>
                          <span>Join the Waitlist</span>
                          <ArrowRight className="size-4 stroke-[2.5]" />
                        </>
                      )}
                    </button>

                    {/* Small Privacy Note (Task 1) */}
                    <div className="pt-2 text-center">
                      <p className="text-xs text-[#599D9C] flex items-center justify-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-[#317978] shrink-0" />
                        <span>We respect your privacy. No spam, just launch updates.</span>
                      </p>
                    </div>
                  </form>
                </div>
              ) : (
                /* Success Message State (Task 2) */
                <div className="bg-[#184948] border border-[#235E5D] rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="size-16 sm:size-20 rounded-full bg-[#113B3A] border-2 border-[#E07A5F] flex items-center justify-center mx-auto shadow-lg shadow-[#E07A5F]/20">
                    <CheckCircle className="size-8 sm:size-10 text-[#E07A5F]" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FDFBF7] tracking-tight font-headline">
                      You're on the list! We'll be in touch soon.
                    </h2>
                    <p className="text-sm sm:text-base text-[#B7E6E5] max-w-md mx-auto leading-relaxed">
                      We've reserved your early access spot for <strong className="text-[#FDFBF7]">{email}</strong>. Watch your inbox for your private invitation to our first Nairobi Live cohorts.
                    </p>
                  </div>

                  {/* Early Access Perks Callout */}
                  <div className="p-4 rounded-2xl bg-[#113B3A]/80 border border-[#235E5D] text-left space-y-2.5 text-xs sm:text-sm text-[#B7E6E5]">
                    <div className="flex items-center gap-2 text-[#FDFBF7] font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="size-4 text-[#E07A5F]" />
                      <span>Your Early Access Benefits:</span>
                    </div>
                    <ul className="space-y-2 text-[#599D9C]">
                      <li className="flex items-start gap-2">
                        <Check className="size-4 text-[#E07A5F] shrink-0 mt-0.5" />
                        <span><strong>Priority Booking:</strong> First pick of live video walk time slots with Nairobi locals.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="size-4 text-[#E07A5F] shrink-0 mt-0.5" />
                        <span><strong>20% Founder Discount:</strong> Automatically applied to your first scheduled tour.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="size-4 text-[#E07A5F] shrink-0 mt-0.5" />
                        <span><strong>Insider Nairobi Map:</strong> Curated guide of top coffee spots, safe neighborhoods, and artisan markets.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Social Share & Return Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex-1 py-3 px-4 bg-[#113B3A] hover:bg-[#235E5D] border border-[#235E5D] text-[#FDFBF7] rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="size-4 text-[#E07A5F]" />
                          <span>Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-4 text-[#599D9C]" />
                          <span>Share Waitlist with Friends</span>
                        </>
                      )}
                    </button>
                    <Link
                      to="/"
                      className="flex-1 py-3 px-4 bg-[#E07A5F] hover:bg-[#d46549] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer min-h-[44px]"
                    >
                      <span>Explore Nairobi Stories</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Trust Badges / Social Proof Metrics */}
            <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { icon: Video, label: "Live Interactive Video", sub: "1-on-1 walkthroughs" },
                { icon: ShieldCheck, label: "Vetted Local Residents", sub: "100% background checked" },
                { icon: Compass, label: "Zero Tourist Traps", sub: "Unfiltered reality" },
                { icon: Users, label: "1,240+ Travelers Waiting", sub: "Limited pilot spots" },
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#184948]/60 border border-[#235E5D]/80 text-center flex flex-col items-center justify-center gap-1.5 backdrop-blur-sm"
                  >
                    <div className="p-2 rounded-xl bg-[#113B3A] border border-[#235E5D] text-[#E07A5F]">
                      <Icon className="size-4" />
                    </div>
                    <span className="text-xs font-bold text-[#FDFBF7]">{item.label}</span>
                    <span className="text-[11px] text-[#599D9C]">{item.sub}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Nairobi City Spotlight Banner ── */}
        <section className="relative px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden border border-[#235E5D] bg-[#184948] relative shadow-2xl">
            <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
              <img
                src="/images/home/nairobi_skyline.jpg"
                alt="Panoramic Nairobi Kenya skyline at golden hour sunset with modern city towers and lush greenery"
                className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#113B3A] via-[#113B3A]/40 to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#113B3A]/80 border border-[#235E5D] text-xs font-bold text-[#E07A5F] backdrop-blur-md">
                    <Camera className="size-3.5" />
                    <span>Nairobi, Kenya · Live Pilot Location</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#FDFBF7] font-headline tracking-tight">
                    Feel the heartbeat of Nairobi before packing your bags.
                  </h3>
                  <p className="text-xs sm:text-sm text-[#B7E6E5] line-clamp-2">
                    From the modern buzz of Westlands to the wild borders of Nairobi National Park, explore authentic neighborhoods guided by resident Kenyans.
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("waitlist-email")
                      input?.scrollIntoView({ behavior: "smooth", block: "center" })
                      input?.focus()
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#E07A5F] hover:bg-[#d46549] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg cursor-pointer transition-all"
                  >
                    <span>Claim Your Access</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Neighborhood Preview Highlights ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[#235E5D]/40 bg-[#143f3e]/30">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold text-[#E07A5F] uppercase tracking-wider">
                What You Will Experience Live
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FDFBF7] font-headline">
                Ask Questions, Inspect Spots, and Travel Smarter
              </h2>
              <p className="text-xs sm:text-sm text-[#599D9C] max-w-xl mx-auto leading-relaxed">
                Connect directly over real-time video with vetted locals who walk you through the real Nairobi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {previewCards.map((card, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-[#235E5D] bg-[#184948] overflow-hidden flex flex-col justify-between group hover:border-[#E07A5F]/50 transition-all duration-300 shadow-lg"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#184948] via-transparent to-black/30" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#113B3A]/80 border border-[#235E5D] text-[#E07A5F] backdrop-blur-md">
                        {card.badge}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-[#599D9C]">
                        <MapPin className="size-3 text-[#E07A5F]" />
                        <span>{card.location}</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#FDFBF7] group-hover:text-[#B7E6E5] transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-[#B7E6E5]/80 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#235E5D]/60 flex items-center justify-between text-xs">
                      <span className="text-[#599D9C] font-semibold">{card.tag}</span>
                      <span className="text-[#E07A5F] font-bold flex items-center gap-1">
                        <span>Live Walk</span>
                        <ArrowRight className="size-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3 Steps: How Early Access Works ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[#235E5D]/40">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold text-[#E07A5F] uppercase tracking-wider">
                How It Works
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FDFBF7] font-headline">
                From Waitlist to Nairobi Local in 3 Steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  title: "Join the Waitlist",
                  desc: "Drop your email to claim your priority queue spot. We notify cohorts in chronological order.",
                  icon: Mail,
                },
                {
                  step: "02",
                  title: "Get Your Private Invite",
                  desc: "Receive your exclusive beta login credentials, founder discount code, and host directory.",
                  icon: Sparkles,
                },
                {
                  step: "03",
                  title: "Tour Nairobi Live",
                  desc: "Hop on a 1-on-1 live stream with your guide. Ask real questions and experience the city unfiltered.",
                  icon: Video,
                },
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl bg-[#184948] border border-[#235E5D] relative space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-[#235E5D] font-headline">
                        {item.step}
                      </span>
                      <div className="p-2 rounded-xl bg-[#113B3A] text-[#E07A5F] border border-[#235E5D]">
                        <Icon className="size-4" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-[#FDFBF7]">{item.title}</h3>
                    <p className="text-xs text-[#599D9C] leading-relaxed">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── FAQ Section ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[#235E5D]/40 bg-[#143f3e]/30">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-[#E07A5F] uppercase tracking-wider">
                Common Questions
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FDFBF7] font-headline">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {faqItems.map((faq, idx) => {
                const isOpen = activeFaq === idx
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#235E5D] bg-[#184948] overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm sm:text-base font-bold text-[#FDFBF7]">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`size-4 text-[#599D9C] shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#E07A5F]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-[#B7E6E5] leading-relaxed border-t border-[#235E5D]/60 animate-in fade-in duration-150">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Bottom Closing Call to Action ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[#235E5D]/40 text-center">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="inline-flex p-3 rounded-2xl bg-[#184948] text-[#E07A5F] border border-[#235E5D] mx-auto shadow-sm">
              <Globe className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FDFBF7] font-headline">
                Ready to Experience Nairobi Like a Local?
              </h2>
              <p className="text-xs sm:text-sm text-[#599D9C] leading-relaxed max-w-md mx-auto">
                Join our early access cohort before spots fill up. Zero spam, just launch updates.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const input = document.getElementById("waitlist-email")
                input?.scrollIntoView({ behavior: "smooth", block: "center" })
                input?.focus()
              }}
              className="py-3.5 px-8 rounded-2xl bg-[#E07A5F] hover:bg-[#d46549] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#E07A5F]/30 hover:shadow-[#E07A5F]/50 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Join the Waitlist Now</span>
              <ArrowRight className="size-4 stroke-[2.5]" />
            </button>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#235E5D]/60 py-8 px-4 text-center text-xs text-[#599D9C]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Ausaguide Kenya. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link to="/privacy" className="hover:text-[#FDFBF7] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-[#FDFBF7] transition-colors">
              Terms of Service
            </Link>
            <Link to="/help" className="hover:text-[#FDFBF7] transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
