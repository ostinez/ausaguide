import { useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  Sparkles,
  Compass,
  CheckCircle2,
  Shield,
  Smartphone,
  ChevronLeft,
  ChevronRight,
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
  bgImage?: string
}

/* ─────────────────────────────────────────────────────────────────────────────
   STEP DEFINITIONS
───────────────────────────────────────────────────────────────────────────── */

const TRAVELER_STEPS: StepData[] = [
  {
    number: 1,
    title: "Search real experiences",
    description:
      "Browse live tours hosted by verified locals across Kenya — street food walks, rooftop art scenes, hidden waterfalls. Every host is identity-verified.",
    tag: "Explore Kenya",
    illustration: <TravelerSearchIllustration />,
    bgImage: "/nairobi_skyline.jpg",
  },
  {
    number: 2,
    title: "See the exact price in KSh",
    description:
      "No hidden fees. No surprise surcharges. What you see is exactly what you pay — broken down so you know where every shilling goes.",
    tag: "Transparent Pricing",
    illustration: <TravelerPriceIllustration />,
  },
  {
    number: 3,
    title: "Book in seconds",
    description:
      "Enter your phone number. No account, no password, no friction. Your booking is confirmed instantly via SMS.",
    tag: "Instant Checkout",
    illustration: <TravelerBookIllustration />,
  },
  {
    number: 4,
    title: "Pay securely with M-PESA",
    description:
      "You get an STK push on your phone. Enter your PIN. Done. No card details stored — just the fastest checkout in Africa.",
    tag: "STK Push Payment",
    illustration: <TravelerMpesaIllustration />,
  },
  {
    number: 5,
    title: "Meet your host live",
    description:
      "Join a real-time video call. See the streets, taste the air, ask questions before you ever buy a plane ticket. Your host is live, right now.",
    tag: "Live Video Tour",
    illustration: <TravelerVideoIllustration />,
  },
  {
    number: 6,
    title: "Rate and rebook",
    description:
      "Leave an honest review. Rebook the same host anytime. Your trust builds the host's reputation — the best rise to the top.",
    tag: "Verified Reviews",
    illustration: <TravelerReviewIllustration />,
  },
]

const HOST_STEPS: StepData[] = [
  {
    number: 1,
    title: "Sign up as a local host",
    description:
      "Students, artists, foodies, certified safari guides — anyone with a story is welcome. Apply in minutes, get approved within 24 hours.",
    tag: "Join Free",
    illustration: <HostSignupIllustration />,
  },
  {
    number: 2,
    title: "Create your tour",
    description:
      "Describe what you'll show. Add photos. Set your own price. Our Tour Studio guides you every step — no tech skills required.",
    tag: "Tour Studio",
    illustration: <HostCreateIllustration />,
  },
  {
    number: 3,
    title: "Get discovered",
    description:
      "Travelers from 50+ countries find you through search, featured stories, and live listings. Your profile does the marketing.",
    tag: "Global Marketplace",
    illustration: <HostDiscoverIllustration />,
  },
  {
    number: 4,
    title: "Get paid to your M-PESA",
    description:
      "Keep 80% of every booking. Payout lands directly in your M-PESA wallet within 24 hours — no delays, no paperwork.",
    tag: "Direct M-PESA Payout",
    illustration: <HostPayoutIllustration />,
  },
  {
    number: 5,
    title: "Host live video tours",
    description:
      "Stream from your phone. Answer live questions. Show the world your Kenya in real time — no studio, no crew.",
    tag: "Interactive Streaming",
    illustration: <HostLiveIllustration />,
  },
  {
    number: 6,
    title: "Build your reputation",
    description:
      "Earn reviews. Grow your income. The best hosts unlock Superhost status — higher placement, more bookings, exclusive partnerships.",
    tag: "Superhost Status",
    illustration: <HostReputationIllustration />,
  },
]

/* ─────────────────────────────────────────────────────────────────────────────
   PHONE MOCKUP
───────────────────────────────────────────────────────────────────────────── */

function PhoneMockup({ step, stepKey }: { step: StepData; stepKey: string }) {
  return (
    <div className="relative w-full max-w-[290px] sm:max-w-[310px] mx-auto select-none">
      {/* Ambient glow */}
      <div
        className="absolute -inset-8 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(10,95,95,0.2) 0%, transparent 70%)" }}
      />

      {/* Phone chassis */}
      <div
        className="relative"
        style={{
          borderRadius: "42px",
          padding: "3px",
          background: "linear-gradient(160deg, #2e4e4e 0%, #162828 50%, #2e4e4e 100%)",
          boxShadow: [
            "0 50px 100px rgba(0,0,0,0.75)",
            "0 0 0 1px rgba(255,255,255,0.05)",
            "inset 0 1px 0 rgba(255,255,255,0.08)",
          ].join(", "),
        }}
      >
        {/* Physical side buttons */}
        <div className="absolute -right-[3px] top-[88px] w-[3px] h-9 bg-[#1a2e2e] rounded-l-sm" />
        <div className="absolute -right-[3px] top-[138px] w-[3px] h-9 bg-[#1a2e2e] rounded-l-sm" />
        <div className="absolute -left-[3px] top-[108px] w-[3px] h-14 bg-[#1a2e2e] rounded-r-sm" />
        <div className="absolute -left-[3px] top-[175px] w-[3px] h-9 bg-[#1a2e2e] rounded-r-sm" />

        {/* Inner black bezel */}
        <div style={{ borderRadius: "40px", overflow: "hidden", background: "#050e0e" }}>
          {/* Dynamic Island */}
          <div
            className="flex justify-center items-center"
            style={{ height: "44px", background: "#050e0e" }}
          >
            <div
              style={{
                width: "90px",
                height: "24px",
                borderRadius: "999px",
                background: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#111f1f" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#0d1f1f", border: "1px solid #1a3a3a" }} />
            </div>
          </div>

          {/* Screen */}
          <div
            style={{
              position: "relative",
              aspectRatio: "9/17",
              background: "#0c1f1f",
              overflow: "hidden",
            }}
          >
            {/* Nairobi skyline bg for step 1 */}
            {step.bgImage && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${step.bgImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  opacity: 0.22,
                  zIndex: 0,
                }}
              />
            )}

            {/* Screen glare */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(140deg, rgba(255,255,255,0.045) 0%, transparent 55%)",
                pointerEvents: "none",
                zIndex: 30,
              }}
            />

            {/* Illustration with fade transition */}
            <AnimatePresence mode="wait">
              <motion.div
                key={stepKey}
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -12 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", zIndex: 1 }}
              >
                {step.illustration}
              </motion.div>
            </AnimatePresence>

            {/* Home indicator */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 40,
                background: "linear-gradient(to top, rgba(8,15,15,0.85) 0%, transparent 100%)",
                pointerEvents: "none",
              }}
            >
              <div style={{ width: 80, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.22)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Drop shadow ellipse */}
      <div
        style={{
          width: "60%",
          height: "16px",
          margin: "4px auto 0",
          borderRadius: "50%",
          background: "rgba(10,95,95,0.25)",
          filter: "blur(12px)",
        }}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   VERTICAL STEPPER (editorial left column)
───────────────────────────────────────────────────────────────────────────── */

function VerticalStepper({
  steps,
  activeIndex,
  onSelect,
}: {
  steps: StepData[]
  activeIndex: number
  onSelect: (i: number) => void
}) {
  return (
    <div style={{ position: "relative" }}>
      {/* Connector line */}
      <div
        style={{
          position: "absolute",
          left: 19,
          top: 22,
          bottom: 22,
          width: 1,
          background: "rgba(35,94,93,0.35)",
        }}
      >
        <motion.div
          style={{ width: "100%", background: "#E87A3D" }}
          animate={{ height: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((step, idx) => {
          const isActive = idx === activeIndex
          const isPast = idx < activeIndex

          return (
            <motion.button
              key={step.number}
              type="button"
              onClick={() => onSelect(idx)}
              whileTap={{ scale: 0.99 }}
              className="w-full text-left cursor-pointer"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                padding: "10px 12px 10px 0",
                background: "none",
                border: "none",
              }}
            >
              {/* Number circle */}
              <div style={{ flexShrink: 0, marginTop: 2, position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 14,
                    transition: "all 0.3s ease",
                    background: isActive
                      ? "#E87A3D"
                      : isPast
                      ? "#0d5e5e"
                      : "rgba(17,59,58,0.5)",
                    color: isActive ? "#fff" : isPast ? "#B7E6E5" : "rgba(183,230,229,0.4)",
                    border: isActive
                      ? "2px solid rgba(232,122,61,0.4)"
                      : isPast
                      ? "2px solid rgba(10,95,95,0.5)"
                      : "1px solid rgba(35,94,93,0.35)",
                    boxShadow: isActive ? "0 0 20px rgba(232,122,61,0.35)" : "none",
                  }}
                >
                  {isPast && !isActive ? (
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : step.number}
                </div>
              </div>

              {/* Text block */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  paddingBottom: idx < steps.length - 1 ? 10 : 0,
                  borderBottom: idx < steps.length - 1 ? "1px solid rgba(35,94,93,0.18)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      color: isActive ? "#fff" : "rgba(245,241,234,0.5)",
                      transition: "color 0.2s ease",
                    }}
                  >
                    {step.title}
                  </span>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(232,122,61,0.14)",
                        color: "#E87A3D",
                        border: "1px solid rgba(232,122,61,0.3)",
                        flexShrink: 0,
                      }}
                    >
                      Active
                    </motion.span>
                  )}
                </div>

                {/* Expanded description — active step only */}
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.p
                      key="desc"
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      style={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "rgba(183,230,229,0.8)",
                        overflow: "hidden",
                      }}
                    >
                      {step.description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────────────────────── */

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<TabType>("travelers")
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  const handleTabChange = useCallback(
    (tab: TabType) => {
      if (tab !== activeTab) {
        setActiveTab(tab)
        setActiveStepIndex(0)
      }
    },
    [activeTab]
  )

  const currentSteps = activeTab === "travelers" ? TRAVELER_STEPS : HOST_STEPS
  const currentStep = currentSteps[activeStepIndex] || currentSteps[0]
  const stepKey = `${activeTab}-${activeStepIndex}`

  const nextStep = useCallback(
    () => setActiveStepIndex((p) => (p + 1) % currentSteps.length),
    [currentSteps.length]
  )
  const prevStep = useCallback(
    () => setActiveStepIndex((p) => (p - 1 + currentSteps.length) % currentSteps.length),
    [currentSteps.length]
  )

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{
        background: "linear-gradient(180deg,#071212 0%,#081717 50%,#071212 100%)",
        borderTop: "1px solid rgba(35,94,93,0.3)",
        borderBottom: "1px solid rgba(35,94,93,0.3)",
      }}
    >
      {/* Ambient glows */}
      <div
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: 700,
          height: 700,
          background: "radial-gradient(circle,rgba(10,95,95,0.16) 0%,transparent 70%)",
          transform: "translate(-35%,-35%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{
          width: 600,
          height: 600,
          background: "radial-gradient(circle,rgba(232,122,61,0.09) 0%,transparent 70%)",
          transform: "translate(35%,35%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">

        {/* ── SECTION HEADER (editorial, left-aligned) ── */}
        <div className="max-w-xl mb-14 sm:mb-18">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{
              background: "rgba(17,59,58,0.65)",
              border: "1px solid rgba(35,94,93,0.5)",
              color: "#B7E6E5",
              backdropFilter: "blur(8px)",
            }}
          >
            <Sparkles className="size-3.5 flex-shrink-0" style={{ color: "#E87A3D" }} />
            <span>Simple by Design</span>
          </div>

          {/* Headline */}
          <h2
            className="text-3xl sm:text-4xl lg:text-[3.2rem] font-black tracking-tight leading-[1.08] mb-4"
            style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
          >
            How{" "}
            <span style={{ color: "#E87A3D" }}>Ausaguide</span>
            <br />
            <span style={{ color: "rgba(245,241,234,0.88)" }}>Works</span>
          </h2>

          <p
            className="text-base sm:text-lg leading-relaxed mb-6"
            style={{ color: "rgba(183,230,229,0.65)" }}
          >
            Real places. Real people. Live before you pay.
          </p>

          {/* Tab switcher */}
          <div
            className="inline-flex p-1 gap-0"
            style={{
              background: "rgba(17,59,58,0.55)",
              border: "1px solid rgba(35,94,93,0.5)",
              borderRadius: 999,
            }}
          >
            {(["travelers", "hosts"] as TabType[]).map((tab) => {
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabChange(tab)}
                  className="relative flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer"
                  style={{ color: isActive ? "#fff" : "rgba(183,230,229,0.5)" }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tabPill"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          tab === "travelers"
                            ? "linear-gradient(135deg,#0A5F5F,#0d7a7a)"
                            : "linear-gradient(135deg,#E87A3D,#d46628)",
                      }}
                      transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab === "travelers" ? (
                      <><Compass className="size-3.5" />For Travelers</>
                    ) : (
                      <><Smartphone className="size-3.5" />For Hosts</>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── MAIN GRID: Left stepper  |  Right phone ── */}
        {/* 
          Mobile: phone first (order-1), then stepper (order-2)
          Desktop: stepper left (col-span-5), phone right (col-span-4 sticky)
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

          {/* LEFT — vertical stepper */}
          <div className="order-2 lg:order-1 lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
              >
                <VerticalStepper
                  steps={currentSteps}
                  activeIndex={activeStepIndex}
                  onSelect={setActiveStepIndex}
                />
              </motion.div>
            </AnimatePresence>

            {/* Controls row */}
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {/* Prev */}
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
                  style={{
                    background: "rgba(17,59,58,0.55)",
                    border: "1px solid rgba(35,94,93,0.5)",
                    color: "rgba(183,230,229,0.75)",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.borderColor = "rgba(232,122,61,0.5)"
                    el.style.color = "#fff"
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.borderColor = "rgba(35,94,93,0.5)"
                    el.style.color = "rgba(183,230,229,0.75)"
                  }}
                >
                  <ChevronLeft className="size-4" />
                  Prev
                </button>

                {/* Dots */}
                <div className="flex items-center gap-1.5 flex-1 justify-center">
                  {currentSteps.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setActiveStepIndex(dotIdx)}
                      className="rounded-full transition-all duration-300 cursor-pointer"
                      style={{
                        height: 6,
                        width: dotIdx === activeStepIndex ? 22 : 6,
                        background:
                          dotIdx === activeStepIndex
                            ? "#E87A3D"
                            : "rgba(35,94,93,0.65)",
                      }}
                      aria-label={`Go to step ${dotIdx + 1}`}
                    />
                  ))}
                </div>

                {/* Next */}
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
                  style={{
                    background: "rgba(17,59,58,0.55)",
                    border: "1px solid rgba(35,94,93,0.5)",
                    color: "rgba(183,230,229,0.75)",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.borderColor = "rgba(232,122,61,0.5)"
                    el.style.color = "#fff"
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.borderColor = "rgba(35,94,93,0.5)"
                    el.style.color = "rgba(183,230,229,0.75)"
                  }}
                >
                  Next
                  <ChevronRight className="size-4" />
                </button>
              </div>

              {/* Primary CTA */}
              {activeTab === "travelers" ? (
                <Link
                  to="/tours"
                  className="group inline-flex items-center justify-center gap-2.5 text-sm font-bold py-3.5 px-6 rounded-2xl transition-all duration-300"
                  style={{
                    background: "linear-gradient(135deg,#E87A3D 0%,#d46628 100%)",
                    color: "#fff",
                    boxShadow: "0 8px 28px rgba(232,122,61,0.3)",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.boxShadow = "0 14px 36px rgba(232,122,61,0.45)"
                    el.style.transform = "translateY(-2px)"
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.boxShadow = "0 8px 28px rgba(232,122,61,0.3)"
                    el.style.transform = "translateY(0)"
                  }}
                >
                  Browse Real Kenya Tours
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <Link
                  to="/auth?tab=signup&role=host"
                  className="group inline-flex items-center justify-center gap-2.5 text-sm font-bold py-3.5 px-6 rounded-2xl transition-all duration-300"
                  style={{
                    background: "rgba(10,95,95,0.45)",
                    color: "#fff",
                    border: "1px solid rgba(183,230,229,0.3)",
                    boxShadow: "0 4px 16px rgba(10,95,95,0.2)",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = "rgba(10,95,95,0.7)"
                    el.style.transform = "translateY(-2px)"
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = "rgba(10,95,95,0.45)"
                    el.style.transform = "translateY(0)"
                  }}
                >
                  Apply to Become a Local Host
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          </div>

          {/* RIGHT — phone mockup (sticky on desktop) */}
          <div className="order-1 lg:order-2 lg:col-span-5 flex flex-col items-center lg:sticky lg:top-24">
            <PhoneMockup step={currentStep} stepKey={stepKey} />

            {/* Animated step label beneath phone */}
            <AnimatePresence mode="wait">
              <motion.div
                key={stepKey + "-label"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, delay: 0.06 }}
                className="mt-6 text-center"
                style={{ maxWidth: 260 }}
              >
                <div
                  className="inline-flex items-center gap-1.5 mb-2 px-3 py-1 rounded-full text-[11px] font-bold"
                  style={{
                    background: "rgba(232,122,61,0.11)",
                    border: "1px solid rgba(232,122,61,0.28)",
                    color: "#E87A3D",
                  }}
                >
                  <span>Step {currentStep.number}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>{currentStep.tag}</span>
                </div>
                <h3
                  className="text-base font-black text-white"
                  style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
                >
                  {currentStep.title}
                </h3>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── TRUST FOOTER ── */}
        <div
          className="mt-16 sm:mt-20 pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center"
          style={{ borderTop: "1px solid rgba(35,94,93,0.28)" }}
        >
          {[
            {
              icon: <CheckCircle2 className="size-4 shrink-0" style={{ color: "#10B981" }} />,
              text: "Live video test before you pay",
            },
            {
              icon: <Shield className="size-4 shrink-0" style={{ color: "#E87A3D" }} />,
              text: "Direct M-PESA STK Push — no stored PINs",
            },
            {
              icon: <Sparkles className="size-4 shrink-0" style={{ color: "#B7E6E5" }} />,
              text: "80% host payout within 24 hours",
            },
          ].map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-center justify-center gap-2 text-xs sm:text-sm"
              style={{ color: "rgba(183,230,229,0.65)" }}
            >
              {icon}
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
