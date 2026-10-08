// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    const { invoice_id, api_ref } = body

    if (!invoice_id && !api_ref) {
      return new Response(
        JSON.stringify({ error: "Missing invoice_id or api_ref" }),
        { status: 400, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

    const secretKey = Deno.env.get("INTASEND_SECRET_KEY") || ""

    if (!secretKey) {
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

    const publishableKey = Deno.env.get("INTASEND_PUBLISHABLE_KEY") || ""
    const isLive = !publishableKey.startsWith("ISPubKey_test")
    const intasendBaseUrl = isLive
      ? "https://payment.intasend.com/api/v1"
      : "https://sandbox.intasend.com/api/v1"

    // Verify payment status with IntaSend
    const verifyEndpoint = invoice_id
      ? `${intasendBaseUrl}/payment/status/?invoice_id=${invoice_id}`
      : `${intasendBaseUrl}/payment/status/?api_ref=${api_ref}`

    const response = await fetch(verifyEndpoint, {
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to verify payment", details: data }),
        { status: response.status, headers: { ...hdrs, "Content-Type": "application/json" } }
      )
    }

    const state = data.invoice?.state || data.state || ""
    const isPaid = state === "COMPLETE" || state === "SUCCESS" || state === "COMPLETED"

    // If payment is confirmed, update booking in Supabase
    if (isPaid) {
      const bookingId = api_ref || data.invoice?.api_ref
      if (bookingId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        )

        await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            payment_status: "paid",
            payment_id: invoice_id || data.invoice?.invoice_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId)
          .catch(console.warn)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        paid: isPaid,
        state,
        invoice_id: data.invoice?.invoice_id || invoice_id,
        api_ref: data.invoice?.api_ref || api_ref,
      }),
      { status: 200, headers: { ...hdrs, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("inta-pay-verify error:", err)
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }
})
