import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import "./index.css"
import App from "./App.tsx"
import { Toaster } from "@/components/ui/sonner.tsx"
import { initSentry, Sentry } from "./lib/sentry"
import { initPostHog } from "./lib/posthog"

const consent = localStorage.getItem("cookie-consent")
if (consent === "accepted") {
  initSentry()
  initPostHog()
} else {
  window.addEventListener("cookies-accepted", () => {
    initSentry()
    initPostHog()
  })
}

// Enforce dark mode globally
document.documentElement.classList.remove("light", "light-mode")
document.documentElement.classList.add("dark")

createRoot(document.getElementById("root")!).render(
  <StrictMode>
      <BrowserRouter>
        <Sentry.ErrorBoundary fallback={<div>Something went wrong. Please try again.</div>}>
          <App />
        </Sentry.ErrorBoundary>
        <Toaster />
      </BrowserRouter>
  </StrictMode>
)
