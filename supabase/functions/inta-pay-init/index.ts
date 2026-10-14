// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const ALLOWED_ORIGINS = [
  "https://ausaguide.com",
  "https://www.ausaguide.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
]

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || ""
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : "https://www.ausaguide.com"
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  }
}

serve(async (req) => {
  const hdrs = corsHeaders(req)
  const reqId = `[inta-pay-init:${Date.now()}]`

  // ── CORS preflight ──────────────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: hdrs })
  }

  console.log(`${reqId} ▶ Request received. Method=${req.method}`)

  // ── Optional Auth Check (Guest checkout supported) ─────────────────────────
  const authHeader = req.headers.get("authorization") || ""
  const rawToken = authHeader.replace(/^Bearer\s+/i, "").trim()
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || ""
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""

  const isUserTokenProvided =
    Boolean(rawToken) &&
    rawToken !== "undefined" &&
    rawToken !== "null" &&
    rawToken !== supabaseAnonKey

  if (isUserTokenProvided) {
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${rawToken}` } },
        auth: { persistSession: false },
      })
      const { data: { user }, error: authErr } = await supabase.auth.getUser(rawToken)
      if (authErr || !user) {
        console.warn(`${reqId} ⚠ Invalid or expired session token:`, authErr?.message)
        return new Response(
          JSON.stringify({
            error: "Session expired or invalid token. Please log in again or continue as guest.",
            details: authErr?.message,
          }),
          { status: 401, headers: { ...hdrs, "Content-Type": "application/json" } }
        )
      }
      console.log(`${reqId} ✓ Authenticated user: ${user.id}`)
    } catch (authEx: any) {
      console.warn(`${reqId} ⚠ Auth check exception:`, authEx?.message)
      return new Response(
        JSON.stringify({ error: "Session verification error", details: authEx?.message }),
        { status: 401, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }
  } else {
    console.log(`${reqId} ▶ Guest checkout (unauthenticated request allowed)`)
  }

  try {
    // ── 1. Parse body ──────────────────────────────────────────────────────────
    let body: Record<string, any>
    try {
      body = await req.json()
    } catch (e) {
      console.error(`${reqId} ✗ Failed to parse JSON body:`, e)
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

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
    } = body

    console.log(`${reqId} ▶ Parsed body:`, JSON.stringify({
      amount, currency, email,
      phone: phone ? `${String(phone).slice(0, 4)}****` : undefined,
      first_name, last_name, api_ref, booking_id, bookingId,
    }))

    // ── 2. Validate required fields ───────────────────────────────────────────
    if (!amount || !email || !phone) {
      console.error(`${reqId} ✗ Missing fields. amount=${amount} email=${email} phone=${phone}`)
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, email, phone" }),
        { status: 400, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

    // ── 3. Read API keys — log which env var name was found ───────────────────
    const pubKeyRaw = Deno.env.get("INTASEND_PUBLISHABLE_KEY")
    const pubKeyAlt = Deno.env.get("INTASEND_PUBLIC_KEY")
    const publishableKey = (pubKeyRaw || pubKeyAlt || "").trim()

    const secKeyV2 = Deno.env.get("INTASEND_SECRET_KEY_V2")
    const secKeyV1 = Deno.env.get("INTASEND_SECRET_KEY")
    const secKeyAlt1 = Deno.env.get("INTASEND_API_TOKEN")
    const secKeyAlt2 = Deno.env.get("INTASEND_PRIVATE_KEY")

    console.log("Using secret from:", Deno.env.get("INTASEND_SECRET_KEY_V2") ? "V2" : "V1");

    const secretKey = (secKeyV2 || secKeyV1 || secKeyAlt1 || secKeyAlt2 || "").trim()

    const walletId = (Deno.env.get("INTASEND_WALLET_ID") || "").trim()
    const siteUrl = Deno.env.get("SITE_URL") || "https://www.ausaguide.com"

    console.log(`${reqId} ▶ Env vars check:`, {
      INTASEND_PUBLISHABLE_KEY: pubKeyRaw ? `${pubKeyRaw.slice(0, 20)}... (length: ${pubKeyRaw.length})` : "❌ NOT SET",
      INTASEND_PUBLIC_KEY: pubKeyAlt ? `${pubKeyAlt.slice(0, 20)}... (length: ${pubKeyAlt.length})` : "not set",
      INTASEND_SECRET_KEY_V2: secKeyV2 ? `${secKeyV2.slice(0, 20)}... (length: ${secKeyV2.length})` : "not set",
      INTASEND_SECRET_KEY: secKeyV1 ? `${secKeyV1.slice(0, 20)}... (length: ${secKeyV1.length})` : "❌ NOT SET",
      INTASEND_API_TOKEN: secKeyAlt1 ? `${secKeyAlt1.slice(0, 20)}... (length: ${secKeyAlt1.length})` : "not set",
      INTASEND_WALLET_ID: walletId || "not set",
      SITE_URL: siteUrl,
      publishableKeySource: pubKeyRaw ? "INTASEND_PUBLISHABLE_KEY" : pubKeyAlt ? "INTASEND_PUBLIC_KEY" : "❌ NONE",
      secretKeySource: secKeyV2 ? "INTASEND_SECRET_KEY_V2" : secKeyV1 ? "INTASEND_SECRET_KEY" : secKeyAlt1 ? "INTASEND_API_TOKEN" : secKeyAlt2 ? "INTASEND_PRIVATE_KEY" : "❌ NONE",
    })

    if (!publishableKey || !secretKey) {
      const missing = []
      if (!publishableKey) missing.push("INTASEND_PUBLISHABLE_KEY (or INTASEND_PUBLIC_KEY)")
      if (!secretKey) missing.push("INTASEND_SECRET_KEY (or INTASEND_API_TOKEN)")
      const errMsg = `Payment gateway not configured. Missing in Edge Function secrets: ${missing.join(", ")}`
      console.error(`${reqId} ✗ ${errMsg}`)
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

    // ── 4. Normalize phone to 254XXXXXXXXX ────────────────────────────────────
    const rawPhone = String(phone).trim()
    const cleanDigits = rawPhone.replace(/\D/g, "")
    let formattedPhone = cleanDigits
    if (cleanDigits.startsWith("254") && cleanDigits.length === 12) {
      formattedPhone = cleanDigits
    } else if (cleanDigits.startsWith("0") && cleanDigits.length === 10) {
      formattedPhone = "254" + cleanDigits.slice(1)
    } else if (cleanDigits.length === 9) {
      formattedPhone = "254" + cleanDigits
    }
    console.log(`${reqId} ▶ Phone normalization: raw="${rawPhone}" → formatted="${formattedPhone}"`)

    // ── 5. Build payload ──────────────────────────────────────────────────────
    const resolvedBookingId = booking_id || bookingId || api_ref || `BK_${Date.now()}`
    const callbackUrl = `${siteUrl}/payment-success?api_ref=${resolvedBookingId}`
    const isLive = !publishableKey.startsWith("ISPubKey_test")
    const intasendBaseUrl = isLive
      ? "https://payment.intasend.com/api/v1"
      : "https://sandbox.intasend.com/api/v1"

    const intasendPayload: Record<string, any> = {
      public_key: publishableKey,
      currency,
      amount: Math.round(Number(amount)),
      email: String(email).trim().toLowerCase(),
      phone_number: formattedPhone,
      first_name: first_name || String(email).split("@")[0],
      last_name: last_name || "",
      api_ref: resolvedBookingId,
      redirect_url: callbackUrl,
      comment: `Ausaguide tour booking – ${resolvedBookingId}`,
    }

    // Include wallet_id only if set — required for some IntaSend account types
    if (walletId) {
      intasendPayload.wallet_id = walletId
    }

    const targetUrl = `${intasendBaseUrl}/checkout/`

    // Log key prefixes and details right before request
    console.log("Publishable key prefix:", publishableKey ? publishableKey.substring(0, 20) : "(not set)")
    console.log("Secret key prefix:", secretKey ? secretKey.substring(0, 20) : "(not set)")
    console.log("Publishable key length:", publishableKey.length)
    console.log("Secret key length:", secretKey.length)

    const actualHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${secretKey}`,
      "Accept": "application/json",
    }

    const loggedHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${secretKey.substring(0, 8)}...[masked] (length: ${secretKey.length})`,
      "Accept": "application/json",
    }

    console.log("Calling IntaSend URL:", targetUrl)
    console.log("Exact request headers being sent:", JSON.stringify(loggedHeaders, null, 2))
    console.log(`${reqId} ▶ Sending payload:`, JSON.stringify({
      ...intasendPayload,
      public_key: `${publishableKey.substring(0, 20)}... (length: ${publishableKey.length})`,
    }, null, 2))

    // ── 6. Call IntaSend API ──────────────────────────────────────────────────
    let response: Response
    try {
      response = await fetch(targetUrl, {
        method: "POST",
        headers: actualHeaders,
        body: JSON.stringify(intasendPayload),
      })
    } catch (fetchErr) {
      console.error(`${reqId} ✗ Network error calling IntaSend:`, fetchErr)
      return new Response(
        JSON.stringify({ error: `Network error reaching IntaSend: ${fetchErr?.message}` }),
        { status: 502, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

    // ── 7. Parse IntaSend response ────────────────────────────────────────────
    const rawResponseText = await response.text()

    if (response.status === 401) {
      console.error("❌ IntaSend 401 Unauthorized! FULL response body:")
      console.error(rawResponseText)
      console.error("IntaSend response statusText:", response.statusText)
      console.error("IntaSend response headers:", JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2))
    } else {
      console.log(`${reqId} ▶ IntaSend response: status=${response.status} body=${rawResponseText}`)
    }

    let data: any = null
    try {
      data = JSON.parse(rawResponseText)
    } catch (_) {
      console.error(`${reqId} ✗ IntaSend returned non-JSON. Raw:`, rawResponseText)
    }

    if (!response.ok) {
      const isGatewayAuthError = response.status === 401 || response.status === 403
      const errorMsg =
        (isGatewayAuthError
          ? "Payment gateway configuration error: IntaSend rejected credentials. Please check INTASEND_SECRET_KEY in Edge Function secrets."
          : null) ||
        data?.message ||
        data?.detail ||
        (Array.isArray(data?.errors) ? data.errors.map((e: any) => e?.detail || JSON.stringify(e)).join("; ") : null) ||
        (typeof data?.error === "string" ? data.error : null) ||
        `IntaSend returned HTTP ${response.status}`

      console.error(`${reqId} ✗ IntaSend error (HTTP ${response.status}):`, errorMsg, "full_data:", data)
      // Never return 401 for upstream payment gateway credential errors — map to 502 so client does not treat it as a session expiry
      return new Response(
        JSON.stringify({
          error: errorMsg,
          raw_response: rawResponseText,
          details: data,
          status: response.status,
          target_url: targetUrl,
          pub_key_prefix: publishableKey ? publishableKey.substring(0, 20) : null,
          sec_key_prefix: secretKey ? secretKey.substring(0, 20) : null,
          sec_key_length: secretKey ? secretKey.length : 0,
        }),
        { status: response.status >= 500 || isGatewayAuthError ? 502 : response.status, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

    // ── 8. Extract checkout URL ───────────────────────────────────────────────
    const checkoutUrl = data?.url || data?.checkout_url || data?.link

    if (!checkoutUrl) {
      console.error(`${reqId} ✗ No checkout URL in IntaSend response:`, data)
      return new Response(
        JSON.stringify({ error: "IntaSend did not return a checkout URL", details: data }),
        { status: 502, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

    console.log(`${reqId} ✓ Success! checkout_url=${checkoutUrl}`)

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: checkoutUrl,
        reference: resolvedBookingId,
        mode: isLive ? "live" : "sandbox",
      }),
      { status: 200, headers: { ...hdrs, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error(`${reqId} ✗ Unhandled exception:`, err)
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
    )
  }
})
