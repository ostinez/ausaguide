import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createClient } from "@supabase/supabase-js"

/**
 * 24-Hour Post-Tour Completion Payout Processor (Payza API)
 *
 * Route: GET/POST /api/cron/process-completed-payouts
 *
 * Logic:
 * 1. Find all bookings where:
 *    - status = 'completed'
 *    - payment_status = 'paid'
 *    - host_paid = false
 *    - paid_at was more than 24 hours ago
 * 2. Calculate host share: total_price * 0.80 (80%)
 * 3. Invoke Payza Payout API (/api/v1/payout) for each eligible booking
 * 4. Insert into payouts table and mark booking host_paid = true
 */

const PAYZA_PUBLIC_KEY = process.env.PAYZA_PUBLIC_KEY || ""
const PAYZA_SECRET_KEY = process.env.PAYZA_SECRET_KEY || ""
const CRON_SECRET = process.env.CRON_SECRET || ""

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ""
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

const HOST_COMMISSION_RATE = 0.80 // Host receives 80%, platform retains 20%

/**
 * Formats Kenyan phone numbers into 254XXXXXXXXX standard format.
 */
function formatKenyaPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "")
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1)
  } else if (!cleaned.startsWith("254") && (cleaned.startsWith("7") || cleaned.startsWith("1"))) {
    cleaned = "254" + cleaned
  }
  return cleaned
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── AUTH GUARD ─────────────────────────────────────────────────────────
  if (!CRON_SECRET) {
    console.error("[Payout Cron] CRON_SECRET is not configured")
    return res.status(500).json({ success: false, error: "Cron not configured" })
  }

  const authHeader = req.headers["authorization"] || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
  if (token !== CRON_SECRET) {
    console.warn("[Payout Cron] Unauthorized request")
    return res.status(401).json({ success: false, error: "Unauthorized" })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[Payout Cron] Missing Supabase credentials")
    return res.status(500).json({ success: false, error: "Supabase credentials not configured." })
  }

  console.log("[Payout Cron] Starting run at", new Date().toISOString())
  console.log("[Payout Cron] SUPABASE_URL:", SUPABASE_URL ? "SET" : "MISSING")
  console.log("[Payout Cron] PAYZA_PUBLIC_KEY:", PAYZA_PUBLIC_KEY ? "SET" : "MISSING")
  console.log("[Payout Cron] PAYZA_SECRET_KEY:", PAYZA_SECRET_KEY ? "SET" : "MISSING")

  if (!PAYZA_PUBLIC_KEY || !PAYZA_SECRET_KEY) {
    console.error("[Payout Cron] PAYZA_PUBLIC_KEY or PAYZA_SECRET_KEY missing in environment!")
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    console.log("[Payout Cron] Looking for bookings with paid_at before:", twentyFourHoursAgo)

    // ── STEP 1: Query eligible bookings ────────────────────────────────────
    const { data: eligibleBookings, error: queryError } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        payment_status,
        total_price,
        payment_amount,
        currency,
        paid_at,
        updated_at,
        created_at,
        host_id,
        guest_phone,
        host:profiles!bookings_host_id_fkey(
          id,
          full_name,
          phone,
          email
        )
      `)
      .eq("status", "completed")
      .eq("payment_status", "paid")
      .eq("host_paid", false)
      .lt("paid_at", twentyFourHoursAgo)
      .limit(50)

    if (queryError) {
      console.error("[Payout Cron] Query error:", JSON.stringify(queryError))
      return res.status(500).json({ success: false, error: queryError.message, detail: queryError })
    }

    console.log(`[Payout Cron] Found ${eligibleBookings?.length ?? 0} eligible booking(s)`)

    if (!eligibleBookings || eligibleBookings.length === 0) {
      return res.status(200).json({
        success: true,
        processed_count: 0,
        message: "No eligible bookings found",
        timestamp: new Date().toISOString(),
      })
    }

    const results: any[] = []
    const payzaPayoutUrl = "https://payzaapi.co.ke/api/v1/payout"

    for (const booking of eligibleBookings) {
      console.log(`\n[Payout Cron] ─── Processing booking ${booking.id} ───`)

      const hostProfile: any = booking.host
      const rawPhone = hostProfile?.phone || booking.guest_phone
      const hostName = hostProfile?.full_name || "Ausaguide Host"
      const hostEmail = hostProfile?.email || null

      console.log(`[Payout Cron]   host_id:    ${booking.host_id}`)
      console.log(`[Payout Cron]   host_name:  ${hostName}`)
      console.log(`[Payout Cron]   raw_phone:  ${rawPhone ?? "MISSING"}`)
      console.log(`[Payout Cron]   host_email: ${hostEmail ?? "N/A"}`)
      console.log(`[Payout Cron]   currency:   ${booking.currency || "NULL → will use KES"}`)
      console.log(`[Payout Cron]   total_price:    ${booking.total_price}`)
      console.log(`[Payout Cron]   payment_amount: ${booking.payment_amount}`)

      // Skip if no phone
      if (!rawPhone) {
        console.warn(`[Payout Cron]   ⚠ SKIPPED: Host phone number missing for booking ${booking.id}`)
        results.push({ booking_id: booking.id, status: "skipped", reason: "missing_host_phone" })
        continue
      }

      const totalAmount = Number(booking.payment_amount || booking.total_price || 0)
      const hostShare = Math.round(totalAmount * HOST_COMMISSION_RATE)
      const platformFee = totalAmount - hostShare
      const currency = "KES"
      const formattedPhone = formatKenyaPhone(rawPhone)

      console.log(`[Payout] Booking ${booking.id}: Total ${totalAmount}, Host 80% = ${hostShare}, Platform 20% = ${platformFee}`)
      console.log(`[Payout Cron]   account_number (phone): ${formattedPhone}`)

      if (hostShare <= 0) {
        console.warn(`[Payout Cron]   ⚠ SKIPPED: Payout amount is 0 for booking ${booking.id}`)
        results.push({ booking_id: booking.id, status: "skipped", reason: "zero_amount" })
        continue
      }

      // Payza Payout Request Payload
      const payoutBody = {
        amount: hostShare,
        currency: "KES",
        method: "mpesa",
        account_number: formattedPhone,
        account_name: hostName,
      }

      console.log(`[Payout Cron] → Payza Payout Request:`, JSON.stringify(payoutBody, null, 2))

      let payzaOk = false
      let trackingId = `PAYZA_PO_${booking.id}_${Date.now()}`
      let responseJson: any = {}
      let httpStatus = 0

      try {
        const payzaRes = await fetch(payzaPayoutUrl, {
          method: "POST",
          headers: {
            "X-Public-Key": PAYZA_PUBLIC_KEY,
            "X-Secret-Key": PAYZA_SECRET_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payoutBody),
        })

        httpStatus = payzaRes.status
        console.log(`[Payout Cron] ← Payza HTTP status: ${httpStatus}`)

        try {
          responseJson = await payzaRes.json()
        } catch {
          responseJson = { raw: await payzaRes.text(), ok: payzaRes.ok }
        }

        console.log(`[Payout Cron] ← Payza Response Body:`, JSON.stringify(responseJson, null, 2))

        const returnedStatus = String(
          responseJson?.payout?.status || responseJson?.data?.status || responseJson?.status || ""
        ).toLowerCase()

        // Payza considers 200/201 without explicit failure status as success
        const isFailedStatus = returnedStatus === "failed" || returnedStatus === "error"
        if (payzaRes.ok && !isFailedStatus) {
          payzaOk = true
        } else {
          console.error(`[Payout Cron] ✗ Payza API rejected payout:`, JSON.stringify(responseJson))
        }
      } catch (fetchErr: any) {
        console.error(`[Payout Cron] ✗ Payza fetch threw exception:`, fetchErr?.message)
        results.push({
          booking_id: booking.id,
          status: "failed",
          error: `Payza fetch error: ${fetchErr?.message}`,
        })
        continue
      }

      // Extract reference from Payza response
      const gatewayReference =
        responseJson?.payout?.reference ||
        responseJson?.data?.reference ||
        responseJson?.reference ||
        trackingId

      const payoutStatus = payzaOk ? "completed" : "failed"

      // ── STEP 2: Insert into payouts table ──────────────────────────────
      console.log(`[Payout Cron] → Inserting record into payouts table (gateway_reference: ${gatewayReference})...`)
      const { data: payoutRow, error: payoutInsertError } = await supabase
        .from("payouts")
        .insert({
          booking_id: booking.id,
          host_id: booking.host_id,
          amount: hostShare,
          currency: "KES",
          payout_method: "mpesa",
          recipient_phone: formattedPhone,
          recipient_name: hostName,
          gateway_reference: gatewayReference,
          tracking_id: trackingId,
          status: payoutStatus,
          failure_reason: payzaOk ? null : (responseJson?.message || responseJson?.error || `HTTP ${httpStatus}`),
          metadata: {
            payza_response: responseJson,
            payza_request: payoutBody,
            http_status: httpStatus,
          },
          processed_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (payoutInsertError) {
        console.error(`[Payout Cron] ✗ payouts insert error:`, JSON.stringify(payoutInsertError))
      } else {
        console.log(`[Payout Cron] ✓ payouts row created: ${payoutRow?.id}`)
      }

      // ── STEP 3: Update bookings to mark host_paid ──────────────────────
      if (payzaOk) {
        console.log(`[Payout Cron] → Marking booking ${booking.id} as host_paid = true...`)
        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            host_paid: true,
            host_payout_amount: hostShare,
            host_payout_id: gatewayReference,
            host_payout_at: new Date().toISOString(),
            currency: "KES",
          })
          .eq("id", booking.id)

        if (updateError) {
          console.error(`[Payout Cron] ✗ bookings update error:`, JSON.stringify(updateError))
          results.push({
            booking_id: booking.id,
            status: "payout_sent_but_db_update_failed",
            error: updateError.message,
            gateway_reference: gatewayReference,
            payza_response: responseJson,
          })
        } else {
          console.log(`[Payout Cron] ✓ Booking ${booking.id} marked host_paid = true`)
          results.push({
            booking_id: booking.id,
            status: "paid",
            host_share: hostShare,
            platform_fee: platformFee,
            host_name: hostName,
            account_number: formattedPhone,
            gateway_reference: gatewayReference,
            currency: "KES",
            payza_response: responseJson,
          })
        }
      } else {
        results.push({
          booking_id: booking.id,
          status: "payza_failed",
          http_status: httpStatus,
          gateway_reference: gatewayReference,
          payza_response: responseJson,
        })
      }
    }

    const failedCount = results.filter((r) => r.status !== "paid" && r.status !== "skipped").length
    const paidCount = results.filter((r) => r.status === "paid").length

    console.log(`\n[Payout Cron] Finished. Paid: ${paidCount}, Failed: ${failedCount}, Total: ${results.length}`)

    return res.status(200).json({
      success: failedCount === 0,
      processed_count: results.length,
      paid_count: paidCount,
      failed_count: failedCount,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (err: any) {
    console.error("[Payout Cron] Unhandled handler error:", err)
    return res.status(500).json({ success: false, error: err?.message || "Internal cron error" })
  }
}
