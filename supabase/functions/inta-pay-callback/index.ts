// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts"

const ALLOWED_ORIGINS = [
  "https://ausaguide.com",
  "https://www.ausaguide.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
]

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || ""
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : "https://www.ausaguide.com"
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-intasend-signature",
    "Vary": "Origin",
  }
}

serve(async (req) => {
  const hdrs = corsHeaders(req)

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: hdrs })
  }

  try {
    const rawBody = await req.text()
    const body = JSON.parse(rawBody || "{}")

    const webhookSecret = Deno.env.get("INTASEND_WEBHOOK_SECRET") || ""

    // ── SECURITY: require webhook secret to be configured ──────────────
    if (!webhookSecret) {
      console.error("inta-pay-callback: INTASEND_WEBHOOK_SECRET is not configured")
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

    // ── SECURITY: verify HMAC-SHA256 signature ──────────────────────────
    const signatureHeader = req.headers.get("x-intasend-signature") || ""
    const hmac = createHmac("sha256", webhookSecret)
    hmac.update(rawBody)
    const expectedSig = hmac.digest("hex")

    if (!signatureHeader || signatureHeader !== expectedSig) {
      console.warn(
        `inta-pay-callback: signature mismatch. Got="${signatureHeader}" Expected="${expectedSig}"`
      )
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        { status: 401, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    )

    const state = body.state || body.status || ""
    const apiRef = body.api_ref || body.invoice?.api_ref || body.invoice?.order_id || ""
    const invoiceId = body.invoice_id || body.invoice?.invoice_id || ""
    const amount = body.value || body.amount || body.invoice?.net_amount || 0
    const currency = body.currency || "KES"

    console.log(
      `IntaSend Webhook received. State: ${state}, ApiRef: ${apiRef}, InvoiceId: ${invoiceId}`
    )

    const isSuccess =
      state === "COMPLETE" || state === "SUCCESS" || state === "COMPLETED"

    if (!isSuccess) {
      console.log(`IntaSend Webhook: non-success state (${state}), no DB update`)
      return new Response(
        JSON.stringify({ received: true, action: "ignored", state }),
        { status: 200, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

    // Look up booking by api_ref (which is the booking UUID)
    const bookingId = apiRef

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
        const currentHistory = Array.isArray(booking.status_history)
          ? [...booking.status_history]
          : []
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
          await supabase
            .from("notifications")
            .insert({
              user_id: booking.host_id,
              title: "Payment Received",
              message: `Payment of ${currency} ${Number(amount).toLocaleString()} received for booking ${bookingId.slice(0, 8)}`,
              type: "booking_confirmed",
              data: { booking_id: bookingId, amount, invoice_id: invoiceId },
              read: false,
            })
            .catch(console.warn)
        }
      } else {
        console.warn(`IntaSend Webhook: booking not found for api_ref="${bookingId}"`)
      }
    }

    return new Response(
      JSON.stringify({ received: true, action: "processed", state, api_ref: apiRef }),
      { status: 200, headers: { ...hdrs, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("inta-pay-callback error:", err)
    return new Response(
      JSON.stringify({ received: true, error: err?.message || "Processing error" }),
      // Still return 200 so IntaSend doesn't retry forever
      { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }
})
