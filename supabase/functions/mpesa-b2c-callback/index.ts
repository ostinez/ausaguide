import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

/**
 * Validates whether a string is a standard 36-character UUID
 */
function isValidUuid(id: unknown): id is string {
  if (typeof id !== "string") return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim())
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
    const originatorConversationId = String(result.OriginatorConversationID || "")
    const conversationId = String(result.ConversationID || "")
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
      ` | OriginatorConversationID: "${originatorConversationId}"` +
      ` | ConversationID: "${conversationId}"` +
      ` | TransactionID: "${transactionId}"` +
      ` | Amount: KES ${payoutAmount}`
    )

    // Supabase client initialization
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // ── STEP 1: Query payouts table using TEXT columns (tracking_id or gateway_reference) ──
    // DO NOT query UUID columns directly with originatorConversationId because Safaricom may return non-UUID strings.
    let payoutRecord: any = null

    if (conversationId) {
      try {
        const { data, error } = await supabase
          .from("payouts")
          .select("id, booking_id, host_id, amount, status")
          .eq("tracking_id", conversationId)
          .maybeSingle()

        if (error) {
          console.error(`[M-Pesa B2C Callback] Error querying payout by tracking_id "${conversationId}":`, error)
        } else if (data) {
          payoutRecord = data
          console.log(`[M-Pesa B2C Callback] Found payout row "${data.id}" via tracking_id "${conversationId}"`)
        }
      } catch (err: any) {
        console.error(`[M-Pesa B2C Callback] Exception querying payout by tracking_id:`, err)
      }
    }

    // Fallback: search by gateway_reference (also a TEXT column)
    if (!payoutRecord && originatorConversationId) {
      try {
        const { data, error } = await supabase
          .from("payouts")
          .select("id, booking_id, host_id, amount, status")
          .eq("gateway_reference", originatorConversationId)
          .maybeSingle()

        if (!error && data) {
          payoutRecord = data
          console.log(`[M-Pesa B2C Callback] Found payout row "${data.id}" via gateway_reference "${originatorConversationId}"`)
        }
      } catch (err: any) {
        console.error(`[M-Pesa B2C Callback] Exception querying payout by gateway_reference:`, err)
      }
    }

    // ── STEP 2: Extract real UUID booking_id ─────────────────────────────────
    let realBookingId: string | null = null
    if (payoutRecord?.booking_id && isValidUuid(payoutRecord.booking_id)) {
      realBookingId = payoutRecord.booking_id
    } else if (isValidUuid(originatorConversationId)) {
      realBookingId = originatorConversationId
    }

    console.log(
      `[M-Pesa B2C Callback] Resolved real booking_id: "${realBookingId}" (payout row: ${payoutRecord?.id || "not found"})`
    )

    // ── STEP 3: Handle Result ───────────────────────────────────────────────
    if (resultCode === 0) {
      console.log(`[M-Pesa B2C Callback] ✅ Payout SUCCESS (Receipt: ${transactionId})`)

      const finalAmount = payoutAmount || Number(payoutRecord?.amount || 0)

      // 1. Update payouts table using its primary key (UUID) or tracking_id (TEXT)
      try {
        let updateQuery = supabase.from("payouts").update({
          status: "completed",
          gateway_reference: transactionId || conversationId,
          amount: finalAmount,
          failure_reason: null,
          metadata: {
            b2c_result: result,
            completed_at: new Date().toISOString(),
          },
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (payoutRecord?.id) {
          updateQuery = updateQuery.eq("id", payoutRecord.id)
        } else if (conversationId) {
          updateQuery = updateQuery.eq("tracking_id", conversationId)
        }

        const { error: payoutUpdateError } = await updateQuery

        if (payoutUpdateError) {
          throw payoutUpdateError
        }
        console.log(`[M-Pesa B2C Callback] payouts table marked as completed (receipt: ${transactionId})`)
      } catch (error: any) {
        console.error("[M-Pesa B2C Callback] Database update failed on payouts table:", error)
      }

      // 2. Update bookings table using the REAL UUID booking_id
      if (realBookingId && isValidUuid(realBookingId)) {
        try {
          const { error: bookingUpdateError } = await supabase
            .from("bookings")
            .update({
              host_paid: true,
              host_payout_amount: finalAmount,
              host_payout_id: transactionId || conversationId,
              host_payout_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", realBookingId)

          if (bookingUpdateError) {
            throw bookingUpdateError
          }
          console.log(
            `[M-Pesa B2C Callback] bookings table updated: id="${realBookingId}", host_paid=true, host_payout_amount=${finalAmount}`
          )
        } catch (error: any) {
          console.error(`[M-Pesa B2C Callback] Database update failed on booking "${realBookingId}":`, error)
        }
      } else {
        console.warn("[M-Pesa B2C Callback] Could not resolve a valid UUID booking_id; bookings table update skipped.")
      }

      // 3. Create host in-app notification if host_id is available
      const resolvedHostId = payoutRecord?.host_id
      if (resolvedHostId && isValidUuid(resolvedHostId)) {
        try {
          const { error: notifError } = await supabase
            .from("notifications")
            .insert({
              user_id: resolvedHostId,
              title: "Payout Dispatched via M-Pesa",
              message: `Your host payout of KES ${Number(finalAmount).toLocaleString()} has been completed (Receipt: ${transactionId || "Confirmed"}).`,
              type: "payout_sent",
              data: {
                booking_id: realBookingId,
                transaction_id: transactionId,
                amount: finalAmount,
              },
              read: false,
            })

          if (notifError) {
            console.warn("[M-Pesa B2C Callback] Notification insert warning:", notifError)
          } else {
            console.log(`[M-Pesa B2C Callback] In-app notification sent to host "${resolvedHostId}"`)
          }
        } catch (err: any) {
          console.warn("[M-Pesa B2C Callback] Notification exception:", err)
        }
      }
    } else {
      // FAILURE (ResultCode !== 0)
      console.error(
        `[M-Pesa B2C Callback] ❌ Payout FAILED (ResultCode ${resultCode}): ${resultDesc}`
      )

      try {
        let failQuery = supabase.from("payouts").update({
          status: "failed",
          failure_reason: resultDesc || `M-Pesa error code ${resultCode}`,
          metadata: {
            b2c_result: result,
            failed_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })

        if (payoutRecord?.id) {
          failQuery = failQuery.eq("id", payoutRecord.id)
        } else if (conversationId) {
          failQuery = failQuery.eq("tracking_id", conversationId)
        }

        const { error: payoutFailError } = await failQuery

        if (payoutFailError) {
          throw payoutFailError
        }
        console.log(`[M-Pesa B2C Callback] payouts table marked as failed`)
      } catch (error: any) {
        console.error("[M-Pesa B2C Callback] Database update failed on failed payout:", error)
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
