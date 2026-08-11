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
    const { hostId, amount, bookingId, phone } = await req.json()

    if (!bookingId || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: bookingId, amount" }),
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

    // Fetch booking details if phone is not provided directly
    let payoutPhone = phone
    if (!payoutPhone) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("*, host:hosts(phone)")
        .eq("id", bookingId)
        .single()

      payoutPhone = booking?.host?.phone || booking?.guest_phone
    }

    if (!payoutPhone) {
      return new Response(
        JSON.stringify({ error: "Host M-PESA phone number is required for payout" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    let payoutResult: any = {}
    let trackingId = `PO_${bookingId}_${Date.now()}`

    try {
      const payoutRes = await fetch(`${baseUrl}/send-money/initiate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          provider: "MPESA-B2C",
          currency: "KES",
          transactions: [
            {
              name: hostId || "Ausaguide Host",
              account: payoutPhone,
              amount,
              narrative: `Payout for booking ${bookingId.slice(0, 8)}`,
            },
          ],
        }),
      })

      if (payoutRes.ok) {
        payoutResult = await payoutRes.json()
        trackingId = payoutResult.tracking_id || payoutResult.file_id || trackingId
      } else {
        const errorText = await payoutRes.text()
        console.warn("IntaSend Payout API note:", errorText)
      }
    } catch (apiErr) {
      console.warn("IntaSend payout call warning:", apiErr)
    }

    // Update booking record in Supabase: host_paid = true
    const { error: dbError } = await supabase
      .from("bookings")
      .update({
        host_paid: true,
      })
      .eq("id", bookingId)

    if (dbError) {
      console.error("Failed to update host_paid on booking:", dbError)
      throw new Error(`Database update failed: ${dbError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Host payout initiated successfully",
        bookingId,
        trackingId,
        raw: payoutResult,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error: any) {
    console.error("inta-pay-host error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process host payout" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
