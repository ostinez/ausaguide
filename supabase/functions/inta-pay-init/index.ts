// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const ALLOWED_ORIGIN = Deno.env.get("SITE_URL") || "https://ausaguide.com"

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || ""
  const allowed =
    origin === "http://localhost:5173" || origin === "http://localhost:3000"
      ? origin
      : ALLOWED_ORIGIN
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
    const publishableKey = pubKeyRaw || pubKeyAlt || ""

    const secKeyRaw = Deno.env.get("INTASEND_SECRET_KEY")
    const secKeyAlt1 = Deno.env.get("INTASEND_API_TOKEN")
    const secKeyAlt2 = Deno.env.get("INTASEND_PRIVATE_KEY")
    const secretKey = secKeyRaw || secKeyAlt1 || secKeyAlt2 || ""

    const walletId = Deno.env.get("INTASEND_WALLET_ID") || ""
    const siteUrl = Deno.env.get("SITE_URL") || "https://ausaguide.com"

    console.log(`${reqId} ▶ Env vars check:`, {
      INTASEND_PUBLISHABLE_KEY: pubKeyRaw ? `${pubKeyRaw.slice(0, 18)}...` : "❌ NOT SET",
      INTASEND_PUBLIC_KEY: pubKeyAlt ? `${pubKeyAlt.slice(0, 18)}...` : "not set",
      INTASEND_SECRET_KEY: secKeyRaw ? `${secKeyRaw.slice(0, 18)}...` : "❌ NOT SET",
      INTASEND_API_TOKEN: secKeyAlt1 ? `${secKeyAlt1.slice(0, 18)}...` : "not set",
      INTASEND_WALLET_ID: walletId || "not set",
      SITE_URL: siteUrl,
      publishableKeySource: pubKeyRaw ? "INTASEND_PUBLISHABLE_KEY" : pubKeyAlt ? "INTASEND_PUBLIC_KEY" : "❌ NONE",
      secretKeySource: secKeyRaw ? "INTASEND_SECRET_KEY" : secKeyAlt1 ? "INTASEND_API_TOKEN" : secKeyAlt2 ? "INTASEND_PRIVATE_KEY" : "❌ NONE",
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

    console.log(`${reqId} ▶ Sending to IntaSend:`, {
      url: targetUrl,
      mode: isLive ? "LIVE" : "SANDBOX",
      payload: {
        ...intasendPayload,
        public_key: `${publishableKey.slice(0, 18)}...`,
      },
    })

    // ── 6. Call IntaSend API ──────────────────────────────────────────────────
    let response: Response
    try {
      response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secretKey}`,
          "Accept": "application/json",
        },
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
    console.log(`${reqId} ▶ IntaSend response: status=${response.status} body=${rawResponseText}`)

    let data: any = null
    try {
      data = JSON.parse(rawResponseText)
    } catch (_) {
      console.error(`${reqId} ✗ IntaSend returned non-JSON. Raw:`, rawResponseText)
    }

    if (!response.ok) {
      const errorMsg =
        data?.message ||
        data?.detail ||
        (Array.isArray(data?.errors) ? data.errors.map((e: any) => e?.detail || JSON.stringify(e)).join("; ") : null) ||
        (typeof data?.error === "string" ? data.error : null) ||
        `IntaSend returned HTTP ${response.status}`

      console.error(`${reqId} ✗ IntaSend error (HTTP ${response.status}):`, errorMsg, "full_data:", data)
      return new Response(
        JSON.stringify({ error: errorMsg, details: data, status: response.status }),
        { status: response.status >= 500 ? 502 : response.status, headers: { ...hdrs, "Content-Type": "application/json" } }
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
