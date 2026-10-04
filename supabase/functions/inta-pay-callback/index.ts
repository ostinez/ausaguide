// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-intasend-signature",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const rawBody = await req.text()
    const body = JSON.parse(rawBody || "{}")

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    )

    const webhookSecret = Deno.env.get("INTASEND_WEBHOOK_SECRET") || ""
    const signatureHeader = req.headers.get("x-intasend-signature") || ""

    // Verify HMAC-SHA256 signature if secret is configured
    if (webhookSecret && signatureHeader) {
      const hmac = createHmac("sha256", webhookSecret)
      hmac.update(rawBody)
      const expectedSig = hmac.digest("hex")
      if (signatureHeader !== expectedSig) {
        console.warn("IntaSend Webhook: signature mismatch")
        return new Response(
          JSON.stringify({ error: "Invalid webhook signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
    }

    const state = body.state || body.status || ""
    const apiRef = body.api_ref || body.invoice?.api_ref || body.invoice?.order_id || ""
    const invoiceId = body.invoice_id || body.invoice?.invoice_id || ""
    const amount = body.value || body.amount || body.invoice?.net_amount || 0
    const currency = body.currency || "KES"

    console.log(`IntaSend Webhook received. State: ${state}, ApiRef: ${apiRef}, InvoiceId: ${invoiceId}`)

    const isSuccess = state === "COMPLETE" || state === "SUCCESS" || state === "COMPLETED"

    if (!isSuccess) {
      console.log(`IntaSend Webhook: non-success state (${state}), no DB update`)
      return new Response(
        JSON.stringify({ received: true, action: "ignored", state }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Look up booking by api_ref or invoice_id
    let bookingId = apiRef
    if (!bookingId || bookingId.startsWith("ORD_") || bookingId.startsWith("BK_")) {
      // api_ref may be the booking ID directly if it was passed as such
      // Try to find by matching api_ref in booking table
    }

    if (supabase && bookingId) {
      const { data: booking, error: fetchErr } = await supabase
        .from("bookings")
        .select("*, tours(title, currency)")
        .eq("id", bookingId)
        .maybeSingle()

      if (fetchErr) {
        console.error("IntaSend Webhook: error fetching booking:", fetchErr)
      }

      if (booking) {
        const currentHistory = Array.isArray(booking.status_history) ? [...booking.status_history] : []
        currentHistory.push({
          status: "confirmed",
          timestamp: new Date().toISOString(),
          note: `IntaSend payment confirmed (Invoice: ${invoiceId})`,
        })

        const { error: updateErr } = await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            payment_status: "paid",
            payment_id: invoiceId || apiRef,
            payment_amount: Number(amount) || booking.total_price,
            currency: currency || booking.currency,
            status_history: currentHistory,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId)

        if (updateErr) {
          console.error("IntaSend Webhook: error updating booking:", updateErr)
        } else {
          console.log(`IntaSend Webhook: booking ${bookingId} marked as paid & confirmed`)
        }

        // Notify host
        if (booking.host_id) {
          await supabase.from("notifications").insert({
            user_id: booking.host_id,
            title: "Payment Received",
            message: `Payment of ${currency} ${Number(amount).toLocaleString()} received for booking ${bookingId.slice(0, 8)}`,
            type: "booking_confirmed",
            data: { booking_id: bookingId, amount, invoice_id: invoiceId },
            read: false,
          }).catch(console.warn)
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true, action: "processed", state, api_ref: apiRef }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("inta-pay-callback error:", err)
    return new Response(
      JSON.stringify({ received: true, error: err?.message || "Processing error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
