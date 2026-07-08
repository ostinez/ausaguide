import { type ReactNode } from "react"
import { motion, AnimatePresence } from "motion/react"
import "./Stepper.css"

interface StepMeta {
  label: string
}

interface StepperProps {
  steps: StepMeta[]
  currentStep: number          // 0-indexed
  children: ReactNode
}

/** Checkmark SVG */
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Stepper({ steps, currentStep, children }: StepperProps) {
  return (
    <div className="stepper-container">
      {/* ── Progress bar ── */}
      <div className="stepper-progress">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep
          const isActive = idx === currentStep
          return (
            <div
              key={step.label}
              className={[
                "stepper-step-item",
                isCompleted ? "completed" : "",
                isActive ? "active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="stepper-circle">
                {isCompleted ? <CheckIcon /> : idx + 1}
              </div>
              <span className="stepper-label">{step.label}</span>
            </div>
          )
        })}
      </div>

      {/* ── Animated content ── */}
      <div className="stepper-content-wrapper">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            className="stepper-content"
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -48 }}
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
