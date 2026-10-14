import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createClient } from "@supabase/supabase-js"

function normalizeKenyanPhone(phone: string): string {
  const digits = String(phone || "").trim().replace(/\D/g, "")
  if (digits.startsWith("254") && digits.length === 12) return digits
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1)
  if (digits.length === 9) return "254" + digits
  return digits
}

const ALLOWED_ORIGINS = [
  "https://ausaguide.com",
  "https://www.ausaguide.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── CORS ────────────────────────────────────────────────────────────────────
  const origin = req.headers["origin"] as string | undefined
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "https://www.ausaguide.com"
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin)
  res.setHeader("Vary", "Origin")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-client-info, apikey")

  if (req.method === "OPTIONS") {
    return res.status(204).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  // ── Auth check ─────────────────────────────────────────────────────────────
  // 1. If NO session token is present (guest checkout), allow the request to proceed with null user_id.
  // 2. If a Supabase session token is present in the Authorization header, validate it.
  // 3. Only return 401 if a token is present but invalid/expired.
  const authHeader = req.headers["authorization"] as string | undefined
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ""
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ""

  let user_id: string | null = null

  if (authHeader) {
    const rawToken = authHeader.replace(/^Bearer\s+/i, "").trim()
    const isTokenProvided =
      Boolean(rawToken) &&
      rawToken !== "undefined" &&
      rawToken !== "null" &&
      rawToken !== supabaseAnonKey

    if (isTokenProvided) {
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${rawToken}` } },
            auth: { persistSession: false },
          })
          const { data: { user }, error: authError } = await supabase.auth.getUser(rawToken)

          if (authError || !user) {
            console.warn("[api/create-checkout] Session token is invalid or expired:", authError?.message)
            return res.status(401).json({
              error: "Session expired or invalid token. Please log in again or continue as guest.",
              details: authError?.message || "Invalid session token",
            })
          }

          user_id = user.id
          console.log("[api/create-checkout] Authenticated user:", user_id)
        } catch (authEx: any) {
          console.error("[api/create-checkout] Token verification exception:", authEx?.message)
          return res.status(401).json({
            error: "Session verification failed.",
            details: authEx?.message,
          })
        }
      } else {
        console.warn("[api/create-checkout] Supabase credentials not set on server; skipping token validation.")
      }
    } else {
      console.log("[api/create-checkout] No user session token provided (proceeding as guest with null user_id)")
    }
  } else {
    console.log("[api/create-checkout] Guest checkout (no Authorization header, user_id is null)")
  }

  try {
    const {
      amount,
      currency = "KES",
      email,
      phone,
      first_name,
      last_name,
      api_ref,
      booking_id,
      bookingId,
    } = req.body || {}

    if (!amount || !email || !phone) {
      return res.status(400).json({ error: "Missing required fields: amount, email, phone" })
    }

    const publishableKey =
      process.env.INTASEND_PUBLISHABLE_KEY ||
      process.env.INTASEND_PUBLIC_KEY ||
      process.env.VITE_INTASEND_PUBLIC_KEY ||
      ""

    const secretKey =
      process.env.INTASEND_SECRET_KEY ||
      process.env.INTASEND_API_TOKEN ||
      process.env.INTASEND_PRIVATE_KEY ||
      ""

    if (!publishableKey || !secretKey) {
      console.error("[api/create-checkout] IntaSend keys not set in Vercel environment variables!")
      console.error("  INTASEND_PUBLISHABLE_KEY present:", !!process.env.INTASEND_PUBLISHABLE_KEY)
      console.error("  INTASEND_SECRET_KEY present:", !!process.env.INTASEND_SECRET_KEY)
      return res.status(500).json({
        error: "Payment gateway is not configured. INTASEND_PUBLISHABLE_KEY and INTASEND_SECRET_KEY must be set as Vercel Environment Variables.",
      })
    }

    const formattedPhone = normalizeKenyanPhone(phone)
    const resolvedBookingId = booking_id || bookingId || api_ref || `BK_${Date.now()}`
    const siteUrl = process.env.SITE_URL || "https://www.ausaguide.com"
    const callbackUrl = `${siteUrl}/payment-success?api_ref=${resolvedBookingId}`

    const payload = {
      public_key: publishableKey,
      currency,
      amount: Math.round(Number(amount)),
      email: String(email).trim().toLowerCase(),
      phone_number: formattedPhone,
      mobile: formattedPhone,
      first_name: first_name || String(email).split("@")[0],
      last_name: last_name || "",
      api_ref: resolvedBookingId,
      redirect_url: callbackUrl,
      comment: `Ausaguide tour booking payment for ${resolvedBookingId}`,
    }

    const isLive = !publishableKey.startsWith("ISPubKey_test")
    const baseUrl = isLive
      ? "https://payment.intasend.com/api/v1"
      : "https://sandbox.intasend.com/api/v1"

    console.log("[api/create-checkout] Calling IntaSend:", {
      url: `${baseUrl}/checkout/`,
      mode: isLive ? "LIVE" : "SANDBOX",
      resolvedBookingId,
    })

    const response = await fetch(`${baseUrl}/checkout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secretKey}`,
      },
      body: JSON.stringify(payload),
    })

    const data: any = await response.json().catch(() => null)

    if (!response.ok) {
      const isGatewayAuthError = response.status === 401 || response.status === 403
      const errorMsg =
        (isGatewayAuthError
          ? "Payment gateway configuration error: IntaSend rejected credentials. Please check INTASEND_SECRET_KEY in Vercel environment variables."
          : null) ||
        data?.message ||
        data?.detail ||
        (Array.isArray(data?.errors) ? data.errors[0]?.detail : null) ||
        (typeof data?.error === "string" ? data.error : null) ||
        `Payment initiation failed with status ${response.status}`

      console.error("[api/create-checkout] IntaSend error:", errorMsg, data)
      // Never return 401 for upstream gateway credential errors — map to 502 so client does not treat it as a session expiry
      return res.status(response.status >= 500 || isGatewayAuthError ? 502 : response.status).json({
        error: errorMsg,
        details: data,
      })
    }

    const checkoutUrl = data?.url || data?.checkout_url
    if (!checkoutUrl) {
      return res.status(502).json({ error: "No checkout URL returned by payment gateway", details: data })
    }

    console.log("[api/create-checkout] ✓ Success. checkout_url:", checkoutUrl)

    return res.status(200).json({
      success: true,
      checkout_url: checkoutUrl,
      reference: resolvedBookingId,
      data,
    })
  } catch (err: any) {
    console.error("[api/create-checkout] Unhandled error:", err)
    return res.status(500).json({ error: err?.message || "Internal server error" })
  }
}
