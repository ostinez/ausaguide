import { useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Compass,
  CheckCircle2,
  Shield,
  Smartphone,
} from "lucide-react"
import {
  TravelerSearchIllustration,
  TravelerPriceIllustration,
  TravelerBookIllustration,
  TravelerMpesaIllustration,
  TravelerVideoIllustration,
  TravelerReviewIllustration,
  HostSignupIllustration,
  HostCreateIllustration,
  HostDiscoverIllustration,
  HostPayoutIllustration,
  HostLiveIllustration,
  HostReputationIllustration,
} from "./HowItWorksIllustrations"

type TabType = "travelers" | "hosts"

interface StepData {
  number: number
  title: string
  description: string
  tag: string
  illustration: React.ReactNode
}

const TRAVELER_STEPS: StepData[] = [
  {
    number: 1,
    title: "Search real experiences",
    description: "Browse live tours hosted by verified locals across Kenya.",
    tag: "Explore Kenya",
    illustration: <TravelerSearchIllustration />,
  },
  {
    number: 2,
    title: "See the exact price in KSh",
    description: "No hidden fees. What you see is what you pay.",
    tag: "Transparent Pricing",
    illustration: <TravelerPriceIllustration />,
  },
  {
    number: 3,
    title: "Book in seconds",
    description: "Enter your phone number. No account needed.",
    tag: "Instant Checkout",
    illustration: <TravelerBookIllustration />,
  },
  {
    number: 4,
    title: "Pay securely with M-PESA",
    description: "You get an STK push on your phone. Enter your PIN. Done.",
    tag: "STK Push",
    illustration: <TravelerMpesaIllustration />,
  },
  {
    number: 5,
    title: "Meet your host live",
    description: "Join a real-time video call. See the streets, food, and culture before you go.",
    tag: "Live Video Tour",
    illustration: <TravelerVideoIllustration />,
  },
  {
    number: 6,
    title: "Rate and rebook",
    description: "Leave an honest review. Rebook the same host anytime.",
    tag: "Verified Reviews",
    illustration: <TravelerReviewIllustration />,
  },
]

const HOST_STEPS: StepData[] = [
  {
    number: 1,
    title: "Sign up as a local host",
    description: "Students, artists, foodies, and certified guides welcome.",
    tag: "Join Free",
    illustration: <HostSignupIllustration />,
  },
  {
    number: 2,
    title: "Create your tour",
    description: "Describe what you'll show. Add photos. Set your price.",
    tag: "Tour Studio",
    illustration: <HostCreateIllustration />,
  },
  {
    number: 3,
    title: "Get discovered",
    description: "Travelers find you through search and the marketplace.",
    tag: "Marketplace Reach",
    illustration: <HostDiscoverIllustration />,
  },
  {
    number: 4,
    title: "Get paid to your M-PESA",
    description: "Keep 80% of every booking. Payout within 24 hours.",
    tag: "Direct M-PESA Payout",
    illustration: <HostPayoutIllustration />,
  },
  {
    number: 5,
    title: "Host live video tours",
    description: "Show your world in real time. Answer questions live.",
    tag: "Interactive Streaming",
    illustration: <HostLiveIllustration />,
  },
  {
    number: 6,
    title: "Build your reputation",
    description: "Earn reviews. Grow your income. Become a top host.",
    tag: "Superhost Status",
    illustration: <HostReputationIllustration />,
  },
]

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<TabType>("travelers")
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  // Switch steps smoothly when switching tabs
  function handleTabChange(tab: TabType) {
    if (tab !== activeTab) {
      setActiveTab(tab)
      setActiveStepIndex(0)
    }
  }

  const currentSteps = activeTab === "travelers" ? TRAVELER_STEPS : HOST_STEPS
  const currentStep = currentSteps[activeStepIndex] || currentSteps[0]

  function nextStep() {
    setActiveStepIndex((prev) => (prev + 1) % currentSteps.length)
  }

  function prevStep() {
    setActiveStepIndex((prev) => (prev - 1 + currentSteps.length) % currentSteps.length)
  }

  return (
    <section className="py-12 sm:py-24 pb-10 bg-[#081717] relative overflow-hidden text-white border-t border-b border-[#235E5D]/40">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#0A5F5F]/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-[#E87A3D]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#235E5D] bg-[#113B3A]/80 text-xs font-bold uppercase tracking-wider text-[#B7E6E5] shadow-sm backdrop-blur-sm">
            <Sparkles className="size-3.5 text-[#E87A3D]" />
            <span>Interactive Guide</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            How <span className="text-[#F5F1EA]">Ausaguide</span>{" "}
            <span className="text-[#E87A3D]">Works</span>
          </h2>

          <p className="text-base sm:text-lg text-[#B7E6E5] font-medium leading-relaxed">
            Real places. Real people. Live before you pay.
          </p>

          {/* ── Two Tabs at Top ── */}
          <div className="pt-4 flex justify-center">
            <div className="inline-flex p-1.5 bg-[#113B3A] border-2 border-[#235E5D] rounded-full shadow-lg relative">
              <button
                type="button"
                onClick={() => handleTabChange("travelers")}
                className={`relative px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === "travelers"
                    ? "text-white shadow-md"
                    : "text-[#B7E6E5]/70 hover:text-white"
                }`}
              >
                {activeTab === "travelers" && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-[#0A5F5F] border border-[#B7E6E5]/30 rounded-full shadow-inner"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Compass className="size-4 text-[#E87A3D]" />
                  For Travelers
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("hosts")}
                className={`relative px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === "hosts"
                    ? "text-white shadow-md"
                    : "text-[#B7E6E5]/70 hover:text-white"
                }`}
              >
                {activeTab === "hosts" && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-[#E87A3D] rounded-full shadow-inner"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Smartphone className="size-4 text-white" />
                  For Hosts
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Interactive Split: 6 Steps Left + Phone Mockup Right ── */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* LEFT COLUMN: 6 Interactive Step Tabs with Progress Line */}
          <div className="lg:col-span-6 relative">
            {/* Vertical connector line behind step circles (desktop only) */}
            <div className="hidden lg:block absolute left-6 top-8 bottom-8 w-0.5 bg-[#235E5D]/60 -translate-x-1/2">
              <motion.div
                className="w-full bg-[#E87A3D]"
                initial={false}
                animate={{
                  height: `${(activeStepIndex / (currentSteps.length - 1)) * 100}%`,
                }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              />
            </div>

            {/* List of 6 Steps */}
            <div className="space-y-3.5">
              {currentSteps.map((step, idx) => {
                const isActive = idx === activeStepIndex
                return (
                  <motion.button
                    key={`${activeTab}-${step.number}`}
                    type="button"
                    onClick={() => setActiveStepIndex(idx)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 relative group cursor-pointer ${
                      isActive
                        ? "bg-[#184948] border-[#E87A3D] shadow-xl shadow-[#0A5F5F]/20"
                        : "bg-[#113B3A]/60 border-[#235E5D]/60 hover:bg-[#113B3A] hover:border-[#317978]/60"
                    }`}
                  >
                    {/* Active highlight glow strip */}
                    {isActive && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#E87A3D] rounded-r" />
                    )}

                    {/* Step Number Circle */}
                    <div
                      className={`relative z-10 size-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-all duration-300 ${
                        isActive
                          ? "bg-[#E87A3D] text-white shadow-md shadow-[#E87A3D]/40 ring-4 ring-[#E87A3D]/20 scale-105"
                          : "bg-[#0A5F5F]/80 text-[#B7E6E5] border border-[#235E5D] group-hover:border-[#E87A3D]/50"
                      }`}
                    >
                      {step.number}
                    </div>

                    {/* Step Info */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-sm sm:text-base font-bold transition-colors ${
                            isActive ? "text-white" : "text-[#F5F1EA]/85 group-hover:text-white"
                          }`}
                        >
                          {step.title}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E87A3D]/20 text-[#E87A3D] border border-[#E87A3D]/40 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs sm:text-sm leading-relaxed transition-colors ${
                          isActive ? "text-[#B7E6E5]" : "text-[#599D9C] line-clamp-2"
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>

                    {/* Small arrow indicator */}
                    <div className="self-center shrink-0">
                      <ChevronRight
                        className={`size-4 transition-transform duration-300 ${
                          isActive
                            ? "text-[#E87A3D] translate-x-1"
                            : "text-[#235E5D] group-hover:text-[#B7E6E5]"
                        }`}
                      />
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Realistic Phone Mockup with Active Illustration */}
          <div className="lg:col-span-6 flex flex-col items-center">
            {/* Phone Mockup Frame */}
            <div className="relative w-full max-w-[340px] sm:max-w-[370px]">
              {/* Outer Phone Hardware Bezel */}
              <div className="relative bg-[#0c1f1f] rounded-[48px] p-3 shadow-2xl border-4 border-[#235E5D] ring-1 ring-white/10">
                {/* Speaker Ear Notch / Dynamic Island */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#000000] rounded-full z-30 flex items-center justify-center">
                  <div className="size-2 rounded-full bg-[#184948] mr-2" />
                  <div className="w-8 h-1.5 rounded-full bg-[#113B3A]" />
                </div>

                {/* Inner Screen Display Area */}
                <div className="relative w-full aspect-[9/16] bg-[#0c1f1f] rounded-[38px] overflow-hidden border border-[#235E5D]/60 shadow-inner flex flex-col">
                  {/* Subtle Screen Reflection Glare */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none z-20" />

                  {/* Dynamic Step Illustration with Smooth Fade-in */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${activeTab}-${activeStepIndex}`}
                      initial={{ opacity: 0, scale: 0.98, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -8 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="w-full h-full flex-1 flex flex-col"
                    >
                      {currentStep.illustration}
                    </motion.div>
                  </AnimatePresence>

                  {/* Phone Bottom Home Indicator Bar */}
                  <div className="h-4 bg-[#0c1f1f] flex items-center justify-center shrink-0 z-20">
                    <div className="w-32 h-1 bg-white/30 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Decorative Subtle Shadow Beneath Phone */}
              <div className="w-3/4 h-6 bg-[#0A5F5F]/40 blur-xl rounded-full mx-auto -mt-2" />
            </div>

            {/* ── Active Step Highlight Card Below Phone ── */}
            <div className="w-full max-w-[420px] mt-6 text-center space-y-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeTab}-${activeStepIndex}-details`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  className="bg-[#113B3A]/90 border border-[#235E5D] rounded-2xl p-4 shadow-lg"
                >
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E87A3D]/20 border border-[#E87A3D]/40 text-[#E87A3D] text-[11px] font-bold mb-1.5">
                    <span>Step {currentStep.number} of 6</span>
                    <span>•</span>
                    <span>{currentStep.tag}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white">
                    {currentStep.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#B7E6E5] mt-1 leading-relaxed">
                    {currentStep.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Step Navigation Controls & CTA */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-3.5 py-2 rounded-xl bg-[#113B3A] border border-[#235E5D] hover:border-[#E87A3D] text-[#B7E6E5] hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                  <span>Prev</span>
                </button>

                {/* Dots indicator */}
                <div className="flex items-center gap-1.5">
                  {currentSteps.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setActiveStepIndex(dotIdx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        dotIdx === activeStepIndex
                          ? "w-6 bg-[#E87A3D]"
                          : "w-2 bg-[#235E5D] hover:bg-[#B7E6E5]/60"
                      }`}
                      aria-label={`Go to step ${dotIdx + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="px-3.5 py-2 rounded-xl bg-[#113B3A] border border-[#235E5D] hover:border-[#E87A3D] text-[#B7E6E5] hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="size-4" />
                </button>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {activeTab === "travelers" ? (
                  <Link
                    to="/tours"
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#E87A3D] hover:bg-[#E87A3D]/90 text-white font-extrabold text-sm py-3 px-6 rounded-xl shadow-lg shadow-[#E87A3D]/25 transition-all duration-300 group cursor-pointer"
                  >
                    <span>Browse Real Kenya Tours</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <Link
                    to="/auth?tab=signup&role=host"
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#0A5F5F] hover:bg-[#0A5F5F]/90 text-white font-extrabold text-sm py-3 px-6 rounded-xl border border-[#B7E6E5]/40 shadow-lg transition-all duration-300 group cursor-pointer"
                  >
                    <span>Apply to Become a Local Host</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Trust Banner at Bottom ── */}
        <div className="mt-16 sm:mt-20 pt-8 border-t border-[#235E5D]/40 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#B7E6E5]">
            <CheckCircle2 className="size-4 text-[#10B981] shrink-0" />
            <span>Live video test before you pay</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#B7E6E5]">
            <Shield className="size-4 text-[#E87A3D] shrink-0" />
            <span>Direct M-PESA STK Push (No stored PINs)</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#B7E6E5]">
            <Sparkles className="size-4 text-[#B7E6E5] shrink-0" />
            <span>80% host payout within 24 hours</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
