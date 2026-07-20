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

// Platform detection — add CSS class hooks for adaptive styles
;(function detectPlatformClasses() {
  const ua = navigator.userAgent
  const html = document.documentElement

  if (/iP(hone|od|ad)/.test(ua)) html.classList.add("is-ios")
  else if (/Android/.test(ua)) html.classList.add("is-android")

  const cores = (navigator as any).hardwareConcurrency ?? 4
  const mem = (navigator as any).deviceMemory ?? 4
  if (cores < 4 || mem < 2) html.classList.add("low-end-device")

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    html.classList.add("reduced-motion")
  }
})()

// Register Service Worker for offline support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((reg) => {
        console.log("Service Worker registered successfully with scope:", reg.scope)
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err)
      })
  })
}


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
