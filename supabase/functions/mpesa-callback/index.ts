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

    console.log("[M-Pesa Callback] ===== RAW PAYLOAD =====")
    console.log(JSON.stringify(body, null, 2))
    console.log("[M-Pesa Callback] =======================")

    // Safaricom sends the result inside Body.stkCallback
    const stkCallback = body?.Body?.stkCallback

    if (!stkCallback) {
      console.warn("[M-Pesa Callback] Warning: Body.stkCallback missing in payload")
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const resultCode   = stkCallback.ResultCode
    const resultDesc   = stkCallback.ResultDesc
    // CheckoutRequestID is ALWAYS present — this is our primary booking lookup key
    const checkoutRequestId: string | null = stkCallback.CheckoutRequestID ?? null

    console.log(
      `[M-Pesa Callback] ResultCode: ${resultCode} | ResultDesc: "${resultDesc}" | CheckoutRequestID: ${checkoutRequestId}`
    )

    // ResultCode === 0 means the customer paid successfully
    if (resultCode === 0) {
      const items: Array<{ Name: string; Value?: any }> =
        stkCallback.CallbackMetadata?.Item || []

      // PART 1.1: Log the ENTIRE CallbackMetadata.Item array
      console.log("[M-Pesa Callback] ENTIRE CallbackMetadata.Item array:")
      console.log(JSON.stringify(items, null, 2))

      // Helper to extract known fields
      const findItem = (name: string) => items.find((i) => i.Name === name)?.Value

      const mpesaReceiptNumber: string | null = findItem("MpesaReceiptNumber")
        ? String(findItem("MpesaReceiptNumber")).trim()
        : null
      const amount: number | null = findItem("Amount") ? Number(findItem("Amount")) : null
      const phoneNumber: string | null = findItem("PhoneNumber")
        ? String(findItem("PhoneNumber"))
        : null

      // PART 1.2: Iterate through array, find object where Name === "AccountReference", and extract Value
      let accountRef: string | null = null
      for (const item of items) {
        if (item.Name === "AccountReference" && item.Value !== undefined && item.Value !== null) {
          accountRef = String(item.Value).trim()
          break
        }
      }

      console.log(
        `[M-Pesa Callback] Extracted values → Receipt: ${mpesaReceiptNumber} | Amount: ${amount}` +
        ` | Phone: ${phoneNumber} | AccountReference: ${accountRef} | CheckoutRequestID: ${checkoutRequestId}`
      )

      // Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      })

      // PART 1.3: Resolve booking ID
      // If AccountReference exists, try matching booking ID directly
      let bookingId: string | null = null

      if (accountRef) {
        const { data: bookingByRef } = await supabase
          .from("bookings")
          .select("id")
          .eq("id", accountRef)
          .maybeSingle()

        if (bookingByRef?.id) {
          bookingId = bookingByRef.id
          console.log(`[M-Pesa Callback] Found booking "${bookingId}" via AccountReference "${accountRef}"`)
        }
      }

      // If AccountReference is empty or did not resolve a booking, use CheckoutRequestID saved during STK push
      if (!bookingId && checkoutRequestId) {
        console.log(
          `[M-Pesa Callback] Resolving booking via CheckoutRequestID "${checkoutRequestId}"...`
        )
        const { data: bookingByCheckout, error: lookupError } = await supabase
          .from("bookings")
          .select("id")
          .eq("payment_reference", checkoutRequestId)
          .maybeSingle()

        if (lookupError) {
          console.error("[M-Pesa Callback] Lookup error with CheckoutRequestID:", lookupError)
        } else if (bookingByCheckout?.id) {
          bookingId = bookingByCheckout.id
          console.log(
            `[M-Pesa Callback] Found booking "${bookingId}" via CheckoutRequestID "${checkoutRequestId}"`
          )
        } else {
          console.warn(
            `[M-Pesa Callback] No booking found with payment_reference = "${checkoutRequestId}"`
          )
        }
      }

      // --- Build the update payload ---
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
      // Keep payment_reference as the CheckoutRequestID (already set, but be explicit)
      if (checkoutRequestId) {
        updateData.payment_reference = checkoutRequestId
      }

      // --- Persist to Supabase ---
      if (bookingId) {
        const { error: updateError } = await supabase
          .from("bookings")
          .update(updateData)
          .eq("id", bookingId)

        if (updateError) {
          console.error(
            `[M-Pesa Callback] Failed to update booking "${bookingId}":`,
            updateError
          )
        } else {
          console.log(
            `[M-Pesa Callback] ✅ Booking "${bookingId}" marked as PAID.` +
            ` Receipt: ${mpesaReceiptNumber} | Amount: KES ${amount}`
          )
        }
      } else {
        console.error(
          "[M-Pesa Callback] ❌ Could not resolve a booking ID." +
          ` CheckoutRequestID: ${checkoutRequestId} | AccountRef: ${accountRef}` +
          " — payment was collected but booking was NOT updated."
        )
      }
    } else {
      // Non-zero ResultCode = user cancelled, timeout, wrong PIN, etc.
      console.log(
        `[M-Pesa Callback] Transaction failed (ResultCode ${resultCode}): ${resultDesc}` +
        ` | CheckoutRequestID: ${checkoutRequestId}`
      )

      // Optionally mark the booking payment as failed so the UI can reflect it
      if (checkoutRequestId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        })

        const { data: booking } = await supabase
          .from("bookings")
          .select("id")
          .eq("payment_reference", checkoutRequestId)
          .maybeSingle()

        if (booking?.id) {
          await supabase
            .from("bookings")
            .update({ payment_status: "failed" })
            .eq("id", booking.id)

          console.log(
            `[M-Pesa Callback] Booking "${booking.id}" marked as payment_status=failed.`
          )
        }
      }
    }

    // Always acknowledge with 200 OK — prevents Safaricom from retrying
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (err: any) {
    console.error("[M-Pesa Callback] Uncaught error:", err)
    // Still return 200 to prevent Safaricom retry flood
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
