// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ALLOWED_ORIGIN = Deno.env.get("SITE_URL") || "https://ausaguide.com"

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || ""
  const allowed = origin === "http://localhost:5173" ? origin : ALLOWED_ORIGIN
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  }
}

serve(async (req) => {
  const hdrs = corsHeaders(req)

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: hdrs })
  }

  try {
    const body = await req.json()
    const { amount, currency = "KES", email, phone, first_name, last_name, api_ref, booking_id, bookingId } = body

    if (!amount || !email || !phone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, email, phone" }),
        { status: 400, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

    const publishableKey =
      Deno.env.get("INTASEND_PUBLISHABLE_KEY") ||
      Deno.env.get("INTASEND_PUBLIC_KEY") ||
      ""
    const secretKey =
      Deno.env.get("INTASEND_SECRET_KEY") ||
      Deno.env.get("INTASEND_API_TOKEN") ||
      Deno.env.get("INTASEND_PRIVATE_KEY") ||
      ""

    if (!publishableKey || !secretKey) {
      console.error("IntaSend API keys not configured. Missing INTASEND_PUBLISHABLE_KEY or INTASEND_SECRET_KEY in Edge Function secrets.")
      return new Response(
        JSON.stringify({
          error: "Payment gateway not configured: Missing INTASEND_PUBLISHABLE_KEY or INTASEND_SECRET_KEY in Supabase Edge Function secrets.",
        }),
        { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

    // Normalize phone number to 254... (Kenyan international format)
    const cleanDigits = String(phone).trim().replace(/\D/g, "")
    let formattedPhone = cleanDigits
    if (cleanDigits.startsWith("254") && cleanDigits.length === 12) {
      formattedPhone = cleanDigits
    } else if (cleanDigits.startsWith("0") && cleanDigits.length === 10) {
      formattedPhone = "254" + cleanDigits.slice(1)
    } else if (cleanDigits.length === 9) {
      formattedPhone = "254" + cleanDigits
    }

    const resolvedBookingId = booking_id || bookingId || api_ref || `BK_${Date.now()}`
    const callbackUrl = `${Deno.env.get("SITE_URL") || "https://ausaguide.com"}/payment-success?api_ref=${resolvedBookingId}`

    const intasendPayload = {
      public_key: publishableKey,
      currency,
      amount: Math.round(Number(amount)),
      email: String(email).trim().toLowerCase(),
      phone_number: formattedPhone,
      mobile: formattedPhone,
      first_name: first_name || email.split("@")[0],
      last_name: last_name || "",
      api_ref: resolvedBookingId,
      redirect_url: callbackUrl,
      comment: `Ausaguide tour booking payment for ${resolvedBookingId}`,
    }

    const isLive = !publishableKey.startsWith("ISPubKey_test")
    const intasendBaseUrl = isLive
      ? "https://payment.intasend.com/api/v1"
      : "https://sandbox.intasend.com/api/v1"

    const response = await fetch(`${intasendBaseUrl}/checkout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secretKey}`,
      },
      body: JSON.stringify(intasendPayload),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      console.error("IntaSend checkout API error:", data)
      const errorMsg =
        data?.message ||
        data?.detail ||
        (Array.isArray(data?.errors) ? data.errors[0]?.detail : null) ||
        (typeof data?.error === "string" ? data.error : null) ||
        `Payment initialization failed with status ${response.status}`

      return new Response(
        JSON.stringify({ error: errorMsg, details: data }),
        { status: response.status, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

    const checkoutUrl = data?.url || data?.checkout_url
    if (!checkoutUrl) {
      return new Response(
        JSON.stringify({ error: "No checkout URL returned by payment gateway", details: data }),
        { status: 502, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: checkoutUrl,
        reference: resolvedBookingId,
        data,
      }),
      { status: 200, headers: { ...hdrs, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("inta-pay-init unhandled error:", err)
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
    )
  }
})
