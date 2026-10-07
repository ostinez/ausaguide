import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import "./index.css"
import App from "./App.tsx"
import { Toaster } from "@/components/ui/sonner.tsx"
import { initSentry } from "./lib/sentry"
import { initPostHog } from "./lib/posthog"
import { GlobalErrorBoundary } from "@/components/common/GlobalErrorBoundary"

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

// Theme initialization (defaults to crisp mineral light canvas)
const savedTheme = localStorage.getItem("ausaguide_theme")
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark")
} else {
  document.documentElement.classList.remove("dark")
}

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

// Auto-recover from stale deployment chunks (Failed to fetch dynamically imported module)
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault()
  const lastReload = sessionStorage.getItem("chunk_reload_time")
  const now = Date.now()
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem("chunk_reload_time", String(now))
    const win = window as any
    if (win.caches) {
      win.caches.keys().then((keys: string[]) => Promise.all(keys.map((k: string) => win.caches.delete(k)))).then(() => {
        win.location.reload()
      })
    } else {
      win.location.reload()
    }
  }
})

// Clean up any stale service workers to prevent cached chunk errors
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      reg.unregister().catch(() => {})
    }
  }).catch(() => {})
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </GlobalErrorBoundary>
  </StrictMode>
)
