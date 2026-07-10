/**
 * src/lib/validation.ts
 *
 * Central validation and sanitisation helpers for Ausaguide.
 * Import from this module instead of writing ad-hoc regex in components.
 */

import DOMPurify from "dompurify"

// ─── Sanitisation ─────────────────────────────────────────────────────────────

/**
 * Strip all HTML tags and potentially dangerous content from a plain-text
 * string.  Use this for every user-supplied text field before storing or
 * rendering it (bio, notes, chat messages, etc.).
 */
export function sanitizeText(value: string): string {
  // DOMPurify with ALLOWED_TAGS: [] strips all HTML, leaving safe plain text.
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
}

// ─── Email ────────────────────────────────────────────────────────────────────

/**
 * RFC-5321–compliant email regex (good enough for UI validation).
 * Returns true if the address looks valid.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required"
  if (!isValidEmail(email)) return "Enter a valid email address (e.g. user@example.com)"
  return null
}

// ─── Phone ────────────────────────────────────────────────────────────────────

/**
 * Kenyan mobile number formats accepted:
 *   • 07XX XXX XXX   (Safaricom / Airtel / Telkom)
 *   • 01XX XXX XXX   (Airtel 010x)
 *   • +2547XX XXX XXX / +2541XX XXX XXX  (international prefix)
 *   • 2547XX XXX XXX  (international without +)
 *
 * Spaces and hyphens are stripped before matching.
 */
export function isValidKenyanPhone(phone: string): boolean {
  const stripped = phone.replace(/[\s\-]/g, "")
  return /^(?:\+?254|0)[17]\d{8}$/.test(stripped)
}

export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "Phone number is required"
  if (!isValidKenyanPhone(phone)) {
    return "Enter a valid Kenyan phone number (e.g. 0712 345 678 or +254 712 345 678)"
  }
  return null
}

// ─── Dates ────────────────────────────────────────────────────────────────────

/**
 * Returns true if the ISO date string (YYYY-MM-DD) is today or in the future.
 * Comparison uses local midnight so same-day bookings are still allowed.
 */
export function isDateInFuture(isoDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(isoDate + "T00:00:00")
  return date >= today
}

export function validateBookingDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return "A booking date is required"
  if (!isDateInFuture(isoDate)) return "Booking date must be today or in the future"
  return null
}

// ─── Name ─────────────────────────────────────────────────────────────────────

export function validateName(name: string): string | null {
  const clean = sanitizeText(name)
  if (!clean) return "Full name is required"
  if (clean.length < 2) return "Name must be at least 2 characters"
  if (clean.length > 100) return "Name must be 100 characters or fewer"
  return null
}

// ─── Password ─────────────────────────────────────────────────────────────────

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required"
  if (password.length < 8) return "Password must be at least 8 characters"
  return null
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return "Please confirm your password"
  if (password !== confirm) return "Passwords do not match"
  return null
}
