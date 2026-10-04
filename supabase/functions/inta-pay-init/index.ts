// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { amount, currency = "KES", email, phone, first_name, last_name, api_ref, booking_id } = body

    if (!amount || !email || !phone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, email, phone" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const publishableKey = Deno.env.get("INTASEND_PUBLISHABLE_KEY") || ""
    const secretKey = Deno.env.get("INTASEND_SECRET_KEY") || ""

    if (!publishableKey || !secretKey) {
      console.error("IntaSend API keys not configured")
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const reference = api_ref || booking_id || `BK_${Date.now()}`
    const callbackUrl = `${Deno.env.get("SITE_URL") || "https://ausaguide.com"}/payment-success?api_ref=${reference}`

    const intasendPayload = {
      public_key: publishableKey,
      currency,
      amount: Number(amount),
      email,
      mobile_tarrif: "KENYA-MPESA",
      mobile: phone,
      first_name: first_name || email.split("@")[0],
      last_name: last_name || "",
      api_ref: reference,
      redirect_url: callbackUrl,
      comment: `Ausaguide booking payment${booking_id ? ` for booking ${booking_id}` : ""}`,
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

    const data = await response.json()

    if (!response.ok) {
      console.error("IntaSend checkout error:", data)
      return new Response(
        JSON.stringify({ error: data?.message || "Payment initialization failed", details: data }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: data.url || data.checkout_url,
        reference,
        data,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("inta-pay-init error:", err)
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
