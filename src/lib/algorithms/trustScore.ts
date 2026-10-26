/**
 * Ausaguide Host Ranking & Trust Score Algorithm
 *
 * Formula:
 * Trust Score = (Average Rating * 0.5) + (Completion Rate * 0.3) - (Number of Strikes * 0.2)
 *
 * Inputs:
 * - averageRating: 0.0 to 5.0 (defaults to 5.0 for new hosts)
 * - completionRate: 0.0 to 1.0 (or percentage 0 to 100), scaled to a 5-point benchmark (e.g. 100% completion = 5.0)
 * - strikesCount: count of cancellations recorded in the `strikes` table
 *
 * Output:
 * A score between 0.0 and 5.0, rounded to 2 decimal places.
 */

export interface TrustScoreInputs {
  averageRating?: number | null
  completedBookings?: number
  cancelledBookings?: number
  completionRate?: number // 0.0 - 1.0 or 0 - 100
  strikesCount?: number
}

export function calculateTrustScore(inputs: TrustScoreInputs): number {
  const avgRating = inputs.averageRating !== undefined && inputs.averageRating !== null
    ? Math.max(0, Math.min(5, Number(inputs.averageRating)))
    : 5.0

  let completionRateScaled = 5.0

  if (inputs.completedBookings !== undefined || inputs.cancelledBookings !== undefined) {
    const completed = Math.max(0, inputs.completedBookings || 0)
    const cancelled = Math.max(0, inputs.cancelledBookings || 0)
    const total = completed + cancelled
    if (total > 0) {
      completionRateScaled = (completed / total) * 5.0
    }
  } else if (inputs.completionRate !== undefined && inputs.completionRate !== null) {
    const rawRate = Number(inputs.completionRate)
    const normalized = rawRate > 1 ? rawRate / 100 : rawRate
    completionRateScaled = Math.max(0, Math.min(1, normalized)) * 5.0
  }

  const strikes = Math.max(0, Number(inputs.strikesCount || 0))

  // Formula: (Average Rating * 0.5) + (Completion Rate * 0.3) - (Number of Strikes * 0.2)
  const rawScore = (avgRating * 0.5) + (completionRateScaled * 0.3) - (strikes * 0.2)

  // Clamp strictly between 0.0 and 5.0
  const clamped = Math.max(0.0, Math.min(5.0, rawScore))
  return Math.round(clamped * 100) / 100
}

/**
 * Returns a human-friendly trust badge tier and style based on trust_score.
 */
export function getTrustScoreTier(score: number): {
  tier: "Super Host" | "Verified Host" | "Good Standing" | "Needs Review"
  colorClass: string
  bgClass: string
  borderClass: string
} {
  if (score >= 4.6) {
    return {
      tier: "Super Host",
      colorClass: "text-emerald-400",
      bgClass: "bg-emerald-500/10",
      borderClass: "border-emerald-500/30",
    }
  }
  if (score >= 4.0) {
    return {
      tier: "Verified Host",
      colorClass: "text-teal-400",
      bgClass: "bg-teal-500/10",
      borderClass: "border-teal-500/30",
    }
  }
  if (score >= 3.0) {
    return {
      tier: "Good Standing",
      colorClass: "text-amber-400",
      bgClass: "bg-amber-500/10",
      borderClass: "border-amber-500/30",
    }
  }
  return {
    tier: "Needs Review",
    colorClass: "text-rose-400",
    bgClass: "bg-rose-500/10",
    borderClass: "border-rose-500/30",
  }
}
