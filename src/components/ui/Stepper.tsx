import { type ReactNode } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Check, Plus, ArrowUpRight, Sparkles } from "lucide-react"
import "./Stepper.css"

export interface StepMeta {
  label: string
  title?: string
  tip?: string
}

interface StepperProps {
  steps: StepMeta[]
  currentStep: number // 0-indexed
  children: ReactNode
}

/** Default contextual tips for onboarding if none provided in StepMeta */
const DEFAULT_TIPS: Record<number, string> = {
  0: "Join over 1,200+ local explorers and verified Kenyan guides.",
  1: "You can explore as a traveler or host authentic live tours.",
  2: "Adding a clear profile photo increases live tour bookings by 3x.",
  3: "Vetted guides get 4x more direct bookings and verified badge.",
  4: "Selecting 3+ interests unlocks instant live matching with vetted guides.",
  5: "You're all set! Explore live video tours or share your world.",
}

export function Stepper({ steps, currentStep, children }: StepperProps) {
  const activeStep = steps[currentStep] || steps[0]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  // Dynamic header title
  const headerTitle = isLastStep
    ? "You made it! 🎉"
    : isFirstStep
    ? "Welcome to Ausaguide!"
    : currentStep >= steps.length - 2
    ? "You're almost there!"
    : "Let's set up your profile"

  // Contextual tip text
  const currentTip =
    activeStep.tip || DEFAULT_TIPS[currentStep] || "Complete all steps to unlock verified local explorer perks."

  // Calculate fill percentage between first and last node
  const fillPercentage =
    steps.length > 1 ? Math.min(100, Math.max(0, (currentStep / (steps.length - 1)) * 100)) : 100

  return (
    <div className="neu-stepper-container">
      {/* ── Top Neumorphic Widget Card ── */}
      <div className="neu-stepper-widget">
        {/* Header Title */}
        <h2 className="neu-stepper-title">{headerTitle}</h2>

        {/* ── Floating Tooltip Badge ── */}
        <div className="neu-tooltip-wrapper">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="neu-tooltip"
          >
            <span className="neu-tooltip-badge">
              <Check className="size-3 stroke-[3]" />
            </span>
            <span className="neu-tooltip-text">
              {currentStep + 1}. {activeStep.title || activeStep.label}
            </span>
            <ArrowUpRight className="neu-tooltip-arrow" />
          </motion.div>
        </div>

        {/* ── Inset Groove Track with Milestone Beads ── */}
        <div className="neu-track-container">
          <div className="neu-groove-track">
            {/* Animated Gradient Fill Bar */}
            <div
              className="neu-groove-fill"
              style={{
                width: `calc(${fillPercentage}% - 1.5rem)`,
                maxWidth: "calc(100% - 2rem)",
              }}
            />

            {/* Inset Milestone Beads */}
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStep
              const isActive = idx === currentStep
              const isUpcoming = idx > currentStep

              return (
                <div key={step.label} className="neu-node-item">
                  <div
                    className={[
                      "neu-bead",
                      isCompleted ? "completed" : "",
                      isActive ? "active" : "",
                      isUpcoming ? "upcoming" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {isCompleted ? (
                      <Check className="size-4 stroke-[3]" />
                    ) : isActive ? (
                      <Check className="size-4.5 stroke-[3] animate-pulse" />
                    ) : (
                      <Plus className="size-3.5 opacity-40" />
                    )}
                  </div>

                  <span
                    className={[
                      "neu-node-label",
                      isCompleted ? "completed" : "",
                      isActive ? "active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Inset Tip Pill at Bottom ── */}
        <div className="neu-tip-pill">
          <Sparkles className="size-3.5 text-[#34D399] shrink-0" />
          <span className="neu-tip-text">
            <strong>Tip:</strong> {currentTip}
          </span>
        </div>
      </div>

      {/* ── Animated Content Area ── */}
      <div className="neu-content-wrapper">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            className="w-full"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Stepper
