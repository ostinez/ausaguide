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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    return res.status(204).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  // ── Auth check (optional but recommended) ──────────────────────────────────
  // We verify the Supabase session token if provided, but do NOT block unauthenticated
  // users — guest checkout is allowed. This prevents false 401s.
  const authHeader = req.headers["authorization"] as string | undefined
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""

  if (authHeader && supabaseUrl && supabaseAnonKey) {
    try {
      const token = authHeader.replace(/^Bearer\s+/i, "")
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      })
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.warn("[api/create-checkout] Auth token check failed (proceeding as guest):", authError.message)
      } else if (user) {
        console.log("[api/create-checkout] Authenticated user:", user.id)
      }
    } catch (authEx: any) {
      console.warn("[api/create-checkout] Auth exception (proceeding as guest):", authEx?.message)
    }
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
      const errorMsg =
        data?.message ||
        data?.detail ||
        (Array.isArray(data?.errors) ? data.errors[0]?.detail : null) ||
        (typeof data?.error === "string" ? data.error : null) ||
        `Payment initiation failed with status ${response.status}`

      console.error("[api/create-checkout] IntaSend error:", errorMsg, data)
      return res.status(response.status >= 500 ? 502 : response.status).json({ error: errorMsg, details: data })
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
