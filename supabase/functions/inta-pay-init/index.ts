// @ts-nocheck -- Deno edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Helper to convert Kenyan phone numbers to international format (254XXXXXXXXX)
function formatIntaSendPhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "")
  if (digits.startsWith("254") && digits.length === 12) {
    return digits
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return "254" + digits.slice(1)
  }
  if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) {
    return "254" + digits
  }
  return digits
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { amount: rawAmount, email, phone: rawPhone, bookingId, currency = "KES", method = "STK_PUSH" } = await req.json()

    if (!rawAmount || !bookingId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, bookingId, email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Minimum amount KES 10 for IntaSend sandbox/live
    const amount = Math.max(10, Math.round(Number(rawAmount) || 10))
    const phone = formatIntaSendPhone(rawPhone)

    const apiKey = Deno.env.get("INTASEND_API_KEY") || ""
    const publicKey = Deno.env.get("INTASEND_PUBLIC_KEY") || ""

    const baseUrl = Deno.env.get("INTASEND_IS_PRODUCTION") === "true" 
      ? "https://payment.intasend.com/api/v1" 
      : "https://sandbox.intasend.com/api/v1"

    console.log(`[inta-pay-init] Method: ${method}, Amount: ${amount} ${currency}, Phone: ${phone}, Booking: ${bookingId}`)

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let paymentId = ""
    let checkoutUrl = ""
    let status = "pending"
    let responseData: any = {}

    if (method === "STK_PUSH" && phone) {
      const payload = {
        public_key: publicKey,
        amount,
        phone_number: phone,
        email,
        api_ref: bookingId,
        currency,
      }
      console.log("[inta-pay-init] STK Push payload:", JSON.stringify(payload))

      // Initiate M-PESA STK Push
      const stkRes = await fetch(`${baseUrl}/payment/mpesa-stk-push/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      const rawText = await stkRes.text()
      console.log(`[inta-pay-init] STK Push response status: ${stkRes.status}, body: ${rawText}`)

      try {
        responseData = JSON.parse(rawText)
      } catch (_) {
        responseData = { raw: rawText }
      }

      if (!stkRes.ok) {
        const errorDetail =
          responseData.detail ||
          responseData.message ||
          responseData.errors?.phone_number?.[0] ||
          responseData.errors?.amount?.[0] ||
          JSON.stringify(responseData)
        throw new Error(`IntaSend STK Push failed (${stkRes.status}): ${errorDetail}`)
      }
      paymentId = responseData.invoice?.invoice_id || responseData.tracking_id || responseData.id || `IS_${bookingId}`
      status = responseData.invoice?.state || responseData.status || "PROCESSING"
    } else {
      const payload = {
        public_key: publicKey,
        amount,
        currency,
        email,
        phone_number: phone || undefined,
        api_ref: bookingId,
        redirect_url: `${req.headers.get("origin") || "http://localhost:5173"}/payment-success?booking_id=${bookingId}`,
      }
      console.log("[inta-pay-init] Hosted checkout payload:", JSON.stringify(payload))

      // Initiate Hosted Checkout Session
      const checkoutRes = await fetch(`${baseUrl}/checkout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      const rawText = await checkoutRes.text()
      console.log(`[inta-pay-init] Hosted checkout status: ${checkoutRes.status}, body: ${rawText}`)

      try {
        responseData = JSON.parse(rawText)
      } catch (_) {
        responseData = { raw: rawText }
      }

      if (!checkoutRes.ok) {
        const errorDetail = responseData.detail || responseData.message || JSON.stringify(responseData)
        throw new Error(`IntaSend Checkout failed (${checkoutRes.status}): ${errorDetail}`)
      }
      paymentId = responseData.id || responseData.signature || `IS_${bookingId}`
      checkoutUrl = responseData.url || ""
      status = responseData.status || "PENDING"
    }

    // Update booking in Supabase with payment tracking info
    const { error: dbError } = await supabase
      .from("bookings")
      .update({
        payment_id: paymentId,
        payment_amount: amount,
        payment_currency: currency,
        payment_status: "pending",
      })
      .eq("id", bookingId)

    if (dbError) {
      console.error("Supabase booking update error:", dbError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentId,
        checkout_url: checkoutUrl,
        status,
        raw: responseData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error: any) {
    console.error("inta-pay-init error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Failed to initialize IntaSend payment" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
