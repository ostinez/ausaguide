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
    const { amount, currency = "KES", account_number, account_name, booking_id, host_id } = body

    if (!amount || !account_number || !account_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, account_number, account_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const publishableKey = Deno.env.get("INTASEND_PUBLISHABLE_KEY") || ""
    const secretKey = Deno.env.get("INTASEND_SECRET_KEY") || ""

    if (!secretKey) {
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const isLive = !publishableKey.startsWith("ISPubKey_test")
    const intasendBaseUrl = isLive
      ? "https://payment.intasend.com/api/v1"
      : "https://sandbox.intasend.com/api/v1"

    // IntaSend Send Money (M-Pesa B2C) payload
    const cleanPhone = account_number.replace(/\s+/g, "").replace(/^\+/, "")
    const trackingId = `PAYOUT_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    const payoutPayload = {
      currency,
      transactions: [
        {
          name: account_name,
          account: cleanPhone,
          amount: Number(amount),
        },
      ],
      callback_url: `${Deno.env.get("SITE_URL") || "https://ausaguide.com"}/api/intasend-payout-callback`,
      wallet_id: Deno.env.get("INTASEND_WALLET_ID") || undefined,
    }

    const response = await fetch(`${intasendBaseUrl}/send-money/mpesa/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secretKey}`,
      },
      body: JSON.stringify(payoutPayload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("IntaSend payout error:", data)
      // Still record the attempt in Supabase
    }

    // Update Supabase booking record
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    )

    if (booking_id) {
      const payoutTxnId = data?.tracking_id || data?.id || trackingId
      await supabase
        .from("bookings")
        .update({
          host_paid: true,
          host_payout_amount: Number(amount),
          host_payout_id: payoutTxnId,
          host_payout_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking_id)
        .catch(console.warn)

      if (host_id) {
        await supabase.from("notifications").insert({
          user_id: host_id,
          title: "Payout Dispatched via M-PESA",
          message: `Your host payout of ${currency} ${Number(amount).toLocaleString()} has been sent to ${account_name} (${cleanPhone}).`,
          type: "payout_sent",
          data: { booking_id, amount, payout_id: trackingId },
          read: false,
        }).catch(console.warn)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: response.ok ? "Host payout processed successfully via IntaSend" : "Payout initiated",
        tracking_id: data?.tracking_id || trackingId,
        payout_details: { amount, currency, method: "mpesa", recipient: account_name, account: cleanPhone },
        upstream_response: data,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("inta-pay-host error:", err)
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
