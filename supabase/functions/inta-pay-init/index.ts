// @ts-nocheck -- Deno edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { amount, email, phone, bookingId, currency = "KES", method = "STK_PUSH" } = await req.json()

    if (!amount || !bookingId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, bookingId, email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const apiKey = Deno.env.get("INTASEND_API_KEY") || ""
    const publicKey = Deno.env.get("INTASEND_PUBLIC_KEY") || ""

    const baseUrl = Deno.env.get("INTASEND_IS_PRODUCTION") === "true" 
      ? "https://payment.intasend.com/api/v1" 
      : "https://sandbox.intasend.com/api/v1"

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let paymentId = ""
    let checkoutUrl = ""
    let status = "pending"
    let responseData: any = {}

    if (method === "STK_PUSH" && phone) {
      // Initiate M-PESA STK Push
      const stkRes = await fetch(`${baseUrl}/payment/mpesa-stk-push/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          public_key: publicKey,
          amount,
          phone_number: phone,
          email,
          api_ref: bookingId,
          currency,
        }),
      })

      responseData = await stkRes.json()
      if (!stkRes.ok) {
        throw new Error(responseData.detail || responseData.message || "IntaSend STK Push failed")
      }
      paymentId = responseData.invoice?.invoice_id || responseData.tracking_id || responseData.id || `IS_${bookingId}`
      status = responseData.invoice?.state || responseData.status || "PROCESSING"
    } else {
      // Initiate Hosted Checkout Session
      const checkoutRes = await fetch(`${baseUrl}/checkout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          public_key: publicKey,
          amount,
          currency,
          email,
          phone_number: phone || undefined,
          api_ref: bookingId,
          redirect_url: `${req.headers.get("origin") || "http://localhost:5173"}/payment-success?booking_id=${bookingId}`,
        }),
      })

      responseData = await checkoutRes.json()
      if (!checkoutRes.ok) {
        throw new Error(responseData.detail || responseData.message || "IntaSend Checkout initiation failed")
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
