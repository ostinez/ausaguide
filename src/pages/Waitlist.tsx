import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, ChevronDown, Loader2, CheckCircle } from "lucide-react"
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
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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
      const { error } = await supabase.from("waitlist").insert({
        email: trimmedEmail,
        role: "traveler",
      })

      if (error) {
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

        // Schema fallback attempt if columns differ
        const { error: fallbackError } = await supabase.from("waitlist").insert([
          { email: trimmedEmail },
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

  const faqItems = [
    {
      q: "What is Ausaguide?",
      a: "A live-video marketplace connecting travelers with local hosts in Kenya.",
    },
    {
      q: "When does it launch?",
      a: "We are currently in early access. Waitlist members get priority access.",
    },
    {
      q: "How do hosts get paid?",
      a: "Hosts keep 80% of every booking, paid out directly via M-Pesa within 24 hours.",
    },
  ]

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center text-white overflow-x-hidden">
      {/* 1. THE BACKGROUND (Option B: Cinematic Glass) */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed z-0"
        style={{ backgroundImage: "url('/images/home/nairobi_skyline.jpg')" }}
      />
      {/* Heavy dark deep teal overlay */}
      <div className="fixed inset-0 bg-[#0A5F5F]/90 backdrop-brightness-[0.4] z-0" />

      {/* 2. THE LAYOUT (Distraction-Free) */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between items-center px-4 sm:px-6 py-6 sm:py-10 max-w-5xl mx-auto">
        {/* Top Left Logo Header */}
        <header className="w-full flex items-center justify-start">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <img
              src="/logo-primary.png"
              alt="Ausaguide Logo"
              width={32}
              height={32}
              className="h-8 w-auto rounded-lg object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <span className="text-xl font-bold tracking-tight text-white font-headline">
              Ausaguide
            </span>
          </Link>
        </header>

        {/* 3. THE FROSTED GLASS CARD (Centered Vertically and Horizontally) */}
        <main className="my-auto w-full py-8 sm:py-12 flex items-center justify-center">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-10 md:p-16 max-w-2xl w-full mx-auto shadow-2xl text-center space-y-6">
            {/* Tiny Badge */}
            <div className="inline-flex items-center justify-center">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#E87A3D]">
                [ EARLY ACCESS ]
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.15] font-headline">
              See Nairobi Live Before You Go.
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-white/70 max-w-lg mx-auto leading-relaxed">
              Our vision is a world where anyone can travel to a new place and feel like a local—before they even leave home.
            </p>

            {/* Form / Success State */}
            {submitted ? (
              <div className="p-6 rounded-2xl bg-white/10 border border-white/20 text-white space-y-2 animate-in fade-in zoom-in-95 duration-300">
                <p className="text-base font-semibold flex items-center justify-center gap-2 text-[#B7E6E5]">
                  <CheckCircle className="size-5 text-[#B7E6E5]" />
                  <span>You're on the list! We'll be in touch soon.</span>
                </p>
                <p className="text-xs text-white/70">
                  Priority access to unfiltered Nairobi live video tours will be sent to your inbox.
                </p>
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit} className="w-full max-w-lg mx-auto space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setErrorMessage(null)
                    }}
                    placeholder="Enter your email address"
                    aria-label="Email address"
                    required
                    disabled={loading}
                    className="w-full sm:flex-1 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-full px-6 py-4 text-sm sm:text-base outline-none focus:ring-2 focus:ring-[#E87A3D] focus:border-transparent transition-all backdrop-blur-md"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#E87A3D] hover:bg-[#d66c30] text-white font-medium rounded-full px-8 py-4 text-sm sm:text-base transition-all duration-200 shadow-lg hover:shadow-orange-500/25 disabled:opacity-70 shrink-0 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        <span>Join the Waitlist</span>
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </div>

                {errorMessage && (
                  <p className="text-xs sm:text-sm text-red-300 font-medium pt-1 animate-in fade-in">
                    {errorMessage}
                  </p>
                )}
              </form>
            )}

            {/* Microcopy below the form */}
            <p className="text-xs sm:text-sm text-white/50 pt-1">
              No spam. Just launch updates.
            </p>
          </div>
        </main>

        {/* 4. THE MINIMAL FAQ (Bottom of page) */}
        <footer className="w-full max-w-xl mx-auto pt-6 pb-2">
          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index
              return (
                <div key={index} className="border-b border-white/10 pb-3 transition-colors">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between text-left text-sm sm:text-base font-medium text-white/90 hover:text-white transition-colors py-1.5 cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`size-4 text-white/60 transition-transform duration-200 shrink-0 ml-3 ${
                        isOpen ? "rotate-180 text-white" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed pt-1.5 pb-2 pr-6 animate-in fade-in duration-200">
                      {item.a}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </footer>
      </div>
    </div>
  )
}
