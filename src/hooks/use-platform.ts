import { useEffect, useState } from "react"

export interface PlatformInfo {
  /** Running on an iPhone or iPad (Safari / WebView) */
  isIOS: boolean
  /** Running on Android browser or WebView */
  isAndroid: boolean
  /** Running on any mobile device */
  isMobile: boolean
  /** Installed as a home-screen PWA (standalone mode) */
  isStandalone: boolean
  /** User prefers reduced motion (accessibility setting) */
  prefersReducedMotion: boolean
  /** Heuristic: low hardware-concurrency or low memory device */
  isLowEndDevice: boolean
  /** Viewport width in px */
  viewportWidth: number
}

function detectPlatform(): PlatformInfo {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : ""

  const isIOS = /iP(hone|od|ad)/.test(ua)
  const isAndroid = /Android/.test(ua)
  const isMobile = isIOS || isAndroid || /Mobi|Mobile/.test(ua)
  const isStandalone =
    (typeof window !== "undefined" &&
      (window.navigator as any).standalone === true) ||
    (typeof window !== "undefined" &&
      window.matchMedia("(display-mode: standalone)").matches)

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  // Low-end heuristic: fewer than 4 CPU cores OR less than 2GB RAM reported
  const nav = typeof navigator !== "undefined" ? (navigator as any) : {}
  const cores = nav.hardwareConcurrency ?? 4
  const mem = nav.deviceMemory ?? 4 // GB, available in Chrome
  const isLowEndDevice = cores < 4 || mem < 2

  const viewportWidth =
    typeof window !== "undefined" ? window.innerWidth : 1280

  return {
    isIOS,
    isAndroid,
    isMobile,
    isStandalone,
    prefersReducedMotion,
    isLowEndDevice,
    viewportWidth,
  }
}

/**
 * usePlatform — returns a reactive snapshot of the current device/OS context.
 * Used to conditionally apply iOS/Android optimisations and adapt animations
 * based on device capability.
 */
export function usePlatform(): PlatformInfo {
  const [platform, setPlatform] = useState<PlatformInfo>(detectPlatform)

  useEffect(() => {
    const motionMQ = window.matchMedia("(prefers-reduced-motion: reduce)")
    const standaloneMQ = window.matchMedia("(display-mode: standalone)")

    function update() {
      setPlatform(detectPlatform())
    }

    motionMQ.addEventListener("change", update)
    standaloneMQ.addEventListener("change", update)
    window.addEventListener("resize", update, { passive: true })

    return () => {
      motionMQ.removeEventListener("change", update)
      standaloneMQ.removeEventListener("change", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  return platform
}
