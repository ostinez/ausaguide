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

    console.log("[M-Pesa B2C Callback] ===== RAW PAYLOAD =====")
    console.log(JSON.stringify(body, null, 2))
    console.log("[M-Pesa B2C Callback] =========================")

    const result = body?.Result || body

    if (!result) {
      console.warn("[M-Pesa B2C Callback] Missing Result object in callback payload")
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const resultCode = Number(result.ResultCode)
    const resultDesc = result.ResultDesc || ""
    const originatorConversationId = result.OriginatorConversationID // Set to booking_id
    const conversationId = result.ConversationID
    let transactionId = result.TransactionID || null

    // Extract parameters from ResultParameters array
    const paramList: Array<{ Key: string; Value: any }> =
      result.ResultParameters?.ResultParameter || []

    const findParam = (key: string) => paramList.find((p) => p.Key === key)?.Value

    const receiptFromParams = findParam("TransactionReceipt")
    if (!transactionId && receiptFromParams) {
      transactionId = String(receiptFromParams).trim()
    }

    const rawAmount = findParam("TransactionAmount")
    const payoutAmount = rawAmount ? Math.round(Number(rawAmount)) : null

    console.log(
      `[M-Pesa B2C Callback] ResultCode: ${resultCode} | ResultDesc: "${resultDesc}"` +
      ` | OriginatorConversationID: ${originatorConversationId}` +
      ` | ConversationID: ${conversationId}` +
      ` | TransactionID: ${transactionId}` +
      ` | Amount: KES ${payoutAmount}`
    )

    // Supabase client initialization
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // Resolve booking
    let booking: any = null
    if (originatorConversationId) {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, host_id, total_price, payment_amount, host_paid")
        .eq("id", originatorConversationId)
        .maybeSingle()

      if (error) {
        console.error(`[M-Pesa B2C Callback] Error querying booking "${originatorConversationId}":`, error)
      } else {
        booking = data
      }
    }

    // SUCCESS (ResultCode === 0)
    if (resultCode === 0) {
      console.log(`[M-Pesa B2C Callback] ✅ Payout SUCCESS for booking "${originatorConversationId}"!`)

      const finalAmount =
        payoutAmount ||
        (booking ? Math.round(Number(booking.payment_amount || booking.total_price || 0) * 0.8) : 0)

      // 1. Update payouts table
      const { error: payoutUpdateError } = await supabase
        .from("payouts")
        .update({
          status: "completed",
          gateway_reference: transactionId || conversationId || originatorConversationId,
          amount: finalAmount,
          failure_reason: null,
          metadata: {
            b2c_result: result,
            completed_at: new Date().toISOString(),
          },
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .or(
          `booking_id.eq.${originatorConversationId},gateway_reference.eq.${originatorConversationId},tracking_id.eq.${conversationId}`
        )

      if (payoutUpdateError) {
        console.error("[M-Pesa B2C Callback] Failed to update payouts row:", payoutUpdateError)
      } else {
        console.log(`[M-Pesa B2C Callback] payouts table marked as status='completed', gateway_reference='${transactionId}'`)
      }

      // 2. Update bookings table
      if (originatorConversationId) {
        const { error: bookingUpdateError } = await supabase
          .from("bookings")
          .update({
            host_paid: true,
            host_payout_amount: finalAmount,
            host_payout_id: transactionId || conversationId,
            host_payout_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", originatorConversationId)

        if (bookingUpdateError) {
          console.error(`[M-Pesa B2C Callback] Failed to update booking "${originatorConversationId}":`, bookingUpdateError)
        } else {
          console.log(
            `[M-Pesa B2C Callback] bookings table updated: host_paid=true, host_payout_amount=${finalAmount}`
          )
        }
      }

      // 3. Create host in-app notification
      if (booking?.host_id) {
        await supabase
          .from("notifications")
          .insert({
            user_id: booking.host_id,
            title: "Payout Dispatched via M-Pesa",
            message: `Your host payout of KES ${Number(finalAmount).toLocaleString()} for booking #${originatorConversationId.slice(0, 8)} has been completed (Receipt: ${transactionId || "Confirmed"}).`,
            type: "payout_sent",
            data: {
              booking_id: originatorConversationId,
              transaction_id: transactionId,
              amount: finalAmount,
            },
            read: false,
          })
          .catch((err: any) => console.warn("[M-Pesa B2C Callback] Notification insert warning:", err))
      }
    } else {
      // FAILURE (ResultCode !== 0)
      console.error(
        `[M-Pesa B2C Callback] ❌ Payout FAILED (ResultCode ${resultCode}): ${resultDesc}`
      )

      // Update payouts table as failed
      if (originatorConversationId) {
        await supabase
          .from("payouts")
          .update({
            status: "failed",
            failure_reason: resultDesc || `M-Pesa error code ${resultCode}`,
            metadata: {
              b2c_result: result,
              failed_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .or(
            `booking_id.eq.${originatorConversationId},gateway_reference.eq.${originatorConversationId},tracking_id.eq.${conversationId}`
          )
          .catch((err: any) => console.warn("[M-Pesa B2C Callback] Payout fail update warning:", err))
      }
    }

    // Always acknowledge Safaricom with 200 OK
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (err: any) {
    console.error("[M-Pesa B2C Callback] Unhandled callback error:", err)
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
