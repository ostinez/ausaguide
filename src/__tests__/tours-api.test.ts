import { describe, it, expect, vi } from "vitest"
import {
  mapProfile,
  mapTour,
  isMissingColumnError,
  fetchTours,
  TOUR_CARD_SELECT,
  TOUR_CARD_SELECT_SAFE,
} from "@/lib/api/tours"
import { getTrustScoreTier } from "@/lib/algorithms/trustScore"
import { supabase } from "@/lib/supabase"

describe("Tours API & Trust Score Resilience", () => {
  it("mapProfile defaults trust_score to 100 when trust_score is missing or null", () => {
    // Missing trust_score
    const profileMissing = mapProfile({
      id: "host-1",
      full_name: "Jane Guide",
    })
    expect(profileMissing.trust_score).toBe(100)

    // Explicit null trust_score
    const profileNull = mapProfile({
      id: "host-2",
      full_name: "John Guide",
      trust_score: null as any,
    })
    expect(profileNull.trust_score).toBe(100)

    // Explicit undefined
    const profileUndefined = mapProfile({
      id: "host-3",
      full_name: "Sam Guide",
      trust_score: undefined,
    })
    expect(profileUndefined.trust_score).toBe(100)
  })

  it("mapProfile preserves valid numeric trust_score when provided", () => {
    const profileWithScore = mapProfile({
      id: "host-1",
      full_name: "Jane Guide",
      trust_score: 4.8,
    })
    expect(profileWithScore.trust_score).toBe(4.8)
  })

  it("mapTour gracefully handles missing or null host object", () => {
    const tourWithNullHost = mapTour({
      id: "tour-1",
      title: "Nairobi Walking Tour",
      host: null,
    })
    expect(tourWithNullHost.host).toBeUndefined()

    const tourWithMissingHost = mapTour({
      id: "tour-2",
      title: "Mombasa Sunset Dhow",
    })
    expect(tourWithMissingHost.host).toBeUndefined()
  })

  it("isMissingColumnError accurately identifies PostgREST missing column errors", () => {
    // Exact Postgres code 42703 (undefined_column)
    expect(isMissingColumnError({ code: "42703", message: "column profiles_1.trust_score does not exist" })).toBe(true)

    // Message variation
    expect(isMissingColumnError({ message: "column profiles_1.trust_score does not exist" })).toBe(true)
    expect(isMissingColumnError({ message: "relation or column does not exist" })).toBe(true)

    // Unrelated error
    expect(isMissingColumnError({ code: "23505", message: "duplicate key value" })).toBe(false)
    expect(isMissingColumnError(null)).toBe(false)
  })

  it("getTrustScoreTier gracefully normalizes 0-100 scale down to 0-5 benchmark", () => {
    // 100 scale
    const tier100 = getTrustScoreTier(100)
    expect(tier100.tier).toBe("Super Host")

    // 95 scale (95 / 100 * 5 = 4.75 -> Super Host)
    const tier95 = getTrustScoreTier(95)
    expect(tier95.tier).toBe("Super Host")

    // Standard 4.8 benchmark
    const tier48 = getTrustScoreTier(4.8)
    expect(tier48.tier).toBe("Super Host")

    // Standard 3.5 benchmark
    const tier35 = getTrustScoreTier(3.5)
    expect(tier35.tier).toBe("Good Standing")
  })

  it("TOUR_CARD_SELECT_SAFE omits trust_score so fallback queries succeed even without the column", () => {
    expect(TOUR_CARD_SELECT).toContain("trust_score")
    expect(TOUR_CARD_SELECT_SAFE).not.toContain("trust_score")
  })
})
