/**
 * Payment Integration Configuration & Feature Toggle
 *
 * Controlled by the NEXT_PUBLIC_PAYMENTS_ENABLED environment variable.
 * - "false" (or unset) => Maintenance mode: site-wide notice banner is active,
 *   checkout payment forms and provider logos are disabled.
 * - "true" => Normal checkout and payment gateway enabled.
 *
 * Default is false.
 */

export function arePaymentsEnabled(): boolean {
  let val: string | undefined

  // 1. Process environment (Vercel / Node / Next-style env)
  try {
    const proc = (globalThis as any).process
    if (proc?.env?.NEXT_PUBLIC_PAYMENTS_ENABLED !== undefined) {
      val = proc.env.NEXT_PUBLIC_PAYMENTS_ENABLED
    }
  } catch (_) {}

  // 2. Vite import.meta.env (client-side)
  if (val === undefined) {
    try {
      if (typeof import.meta !== "undefined" && import.meta.env) {
        val = (import.meta.env.NEXT_PUBLIC_PAYMENTS_ENABLED as string | undefined) ??
              (import.meta.env.VITE_PAYMENTS_ENABLED as string | undefined)
      }
    } catch (_) {}
  }

  // 3. Fallback: window global if configured
  if (val === undefined && typeof window !== "undefined") {
    val = (window as any).__PAYMENTS_ENABLED__
  }

  // Default to false
  if (val === undefined || val === null || val === "") {
    return false
  }

  return String(val).trim().toLowerCase() === "true"
}
