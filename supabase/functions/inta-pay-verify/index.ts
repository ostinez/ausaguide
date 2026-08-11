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
    const { payment_id, booking_id } = await req.json()

    if (!payment_id && !booking_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: payment_id or booking_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const apiKey = Deno.env.get("INTASEND_API_KEY") || ""
    const baseUrl = Deno.env.get("INTASEND_IS_PRODUCTION") === "true"
      ? "https://payment.intasend.com/api/v1"
      : "https://sandbox.intasend.com/api/v1"

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Retrieve booking record first
    let query = supabase.from("bookings").select("*")
    if (payment_id) {
      query = query.eq("payment_id", payment_id)
    } else {
      query = query.eq("id", booking_id)
    }

    const { data: booking, error: fetchErr } = await query.single()

    if (fetchErr || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking record not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const targetPaymentId = payment_id || booking.payment_id

    let isPaid = false
    let intaSendStatus = "PENDING"
    let statusResponse: any = {}

    if (targetPaymentId) {
      try {
        const verifyRes = await fetch(`${baseUrl}/payment/status/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ invoice_id: targetPaymentId }),
        })

        if (verifyRes.ok) {
          statusResponse = await verifyRes.json()
          const state = (statusResponse.invoice?.state || statusResponse.state || statusResponse.status || "").toUpperCase()
          intaSendStatus = state
          if (["COMPLETE", "SUCCESS", "SUCCESSFUL", "PAID"].includes(state)) {
            isPaid = true
          }
        }
      } catch (err) {
        console.warn("IntaSend API status check warning:", err)
      }
    }

    // In Sandbox mode, if status check returned PENDING or mock test, we verify and update payment_status
    if (isPaid || booking.payment_status === "paid") {
      const { error: updateErr } = await supabase
        .from("bookings")
        .update({
          payment_status: "paid",
          status: booking.status === "pending" ? "confirmed" : booking.status,
        })
        .eq("id", booking.id)

      if (updateErr) {
        console.error("Failed to update booking status:", updateErr)
      }

      return new Response(
        JSON.stringify({
          verified: true,
          payment_status: "paid",
          booking_id: booking.id,
          raw: statusResponse,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    } else {
      return new Response(
        JSON.stringify({
          verified: false,
          payment_status: booking.payment_status || intaSendStatus,
          booking_id: booking.id,
          raw: statusResponse,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
  } catch (error: any) {
    console.error("inta-pay-verify error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Failed to verify payment status" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
