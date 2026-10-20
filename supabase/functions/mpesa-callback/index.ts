import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  // Safaricom callbacks are HTTP POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const rawBody = await req.text()
    const body = JSON.parse(rawBody || "{}")

    console.log("[M-Pesa Callback] Raw payload received:", JSON.stringify(body, null, 2))

    // Safaricom sends the result inside Body.stkCallback
    const stkCallback = body?.Body?.stkCallback

    if (!stkCallback) {
      console.warn("[M-Pesa Callback] Warning: Body.stkCallback missing in payload")
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const resultCode = stkCallback.ResultCode
    const resultDesc = stkCallback.ResultDesc
    const checkoutRequestId = stkCallback.CheckoutRequestID

    console.log(
      `[M-Pesa Callback] ResultCode: ${resultCode}, ResultDesc: "${resultDesc}", CheckoutRequestID: ${checkoutRequestId}`
    )

    // ResultCode === 0 signifies success
    if (resultCode === 0) {
      const items: Array<{ Name: string; Value?: any }> =
        stkCallback.CallbackMetadata?.Item || []

      // 1. Extract AccountReference (our booking ID) from CallbackMetadata.Item where Name === "AccountReference"
      const accountRefItem = items.find((item) => item.Name === "AccountReference")
      let bookingId = accountRefItem?.Value ? String(accountRefItem.Value).trim() : null

      // Fallback: Check URL search query param if AccountReference was not in CallbackMetadata.Item
      if (!bookingId) {
        const url = new URL(req.url)
        bookingId =
          url.searchParams.get("reference") ||
          url.searchParams.get("booking_id") ||
          url.searchParams.get("id")
      }

      // Extract MpesaReceiptNumber, Amount, and TransactionDate if available
      const mpesaReceiptItem = items.find((item) => item.Name === "MpesaReceiptNumber")
      const mpesaReceiptNumber = mpesaReceiptItem?.Value ? String(mpesaReceiptItem.Value).trim() : null

      const amountItem = items.find((item) => item.Name === "Amount")
      const amount = amountItem?.Value ? Number(amountItem.Value) : null

      console.log(
        `[M-Pesa Callback] Payment Success! Booking ID: ${bookingId}, Receipt: ${mpesaReceiptNumber}, Amount: ${amount}`
      )

      if (bookingId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        })

        // Update the bookings table in Supabase:
        // set payment_status = 'paid', paid_at = new Date().toISOString(), and currency = 'KES'
        const updateData: Record<string, any> = {
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          currency: "KES",
          status: "confirmed",
        }

        if (mpesaReceiptNumber) {
          updateData.payment_id = mpesaReceiptNumber
          updateData.stripe_payment_intent_id = mpesaReceiptNumber
        }

        if (amount) {
          updateData.payment_amount = amount
        }

        const { error: updateError } = await supabase
          .from("bookings")
          .update(updateData)
          .eq("id", bookingId)

        if (updateError) {
          console.error(`[M-Pesa Callback] Failed to update booking ${bookingId}:`, updateError)
        } else {
          console.log(`[M-Pesa Callback] Successfully updated booking ${bookingId} to paid.`)
        }
      } else {
        console.warn(
          "[M-Pesa Callback] Notice: Could not extract AccountReference or booking ID from callback items or query params."
        )
      }
    } else {
      console.log(`[M-Pesa Callback] Transaction unsuccessful (${resultCode}): ${resultDesc}`)
    }

    // Acknowledge receipt to Safaricom with 200 OK and expected JSON body
    return new Response(
      JSON.stringify({
        ResultCode: 0,
        ResultDesc: "Success",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (err: any) {
    console.error("[M-Pesa Callback] Error processing callback:", err)
    // Always return 200 OK acknowledgment to prevent Safaricom retry flood
    return new Response(
      JSON.stringify({
        ResultCode: 0,
        ResultDesc: "Success",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
