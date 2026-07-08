/**
 * Lightweight in-memory rate limiter using a sliding-window algorithm.
 *
 * Each "bucket" tracks an array of timestamps for requests made within the
 * current window. Stale timestamps are pruned on every check so the store
 * never accumulates unbounded data.
 *
 * NOTE: Because this runs purely in the browser, the counters reset on page
 * reload. For production server-side enforcement a Supabase Edge Function or
 * Redis-backed store should be used. This implementation provides a UX-level
 * guard that prevents accidental rapid-fire requests.
 */

interface Bucket {
  timestamps: number[]
}

const store = new Map<string, Bucket>()

/**
 * Attempt to consume one request slot for the given key.
 *
 * @param key       Unique identifier (e.g. `"booking:userId"`)
 * @param limit     Maximum requests allowed within the window
 * @param windowMs  Sliding window size in milliseconds (default: 60 000 = 1 min)
 * @returns `true` if the request is allowed, `false` if the limit is exceeded
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000
): boolean {
  const now = Date.now()
  const cutoff = now - windowMs

  if (!store.has(key)) {
    store.set(key, { timestamps: [] })
  }

  const bucket = store.get(key)!

  // Prune timestamps outside the current window
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff)

  if (bucket.timestamps.length >= limit) {
    return false // rate limit exceeded
  }

  bucket.timestamps.push(now)
  return true
}

/**
 * Returns the number of seconds until the oldest request in the bucket
 * falls outside the window (i.e. how long the caller must wait).
 * Returns 0 if the key is not tracked or the bucket is empty.
 */
export function getRetryAfterSeconds(key: string, windowMs = 60_000): number {
  const bucket = store.get(key)
  if (!bucket || bucket.timestamps.length === 0) return 0
  const oldest = bucket.timestamps[0]
  const retryAt = oldest + windowMs
  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000))
}

/** Convenience error thrown when a rate limit is exceeded. */
export class RateLimitError extends Error {
  constructor(message = "Too many requests. Please wait a moment.") {
    super(message)
    this.name = "RateLimitError"
  }
}
