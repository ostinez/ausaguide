import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createClient } from "@supabase/supabase-js"

/**
 * 24-Hour Post-Tour Completion Payout Processor
 *
 * Route: GET/POST /api/cron/process-completed-payouts
 *
 * Logic:
 * 1. Find all bookings where:
 *    - status = 'completed'
 *    - payment_status = 'paid'
 *    - host_paid != true
 *    - updated_at was more than 24 hours ago
 * 2. Calculate host share: total_price * 0.80 (80%)
 * 3. Invoke IntaSend send-money for each eligible booking
 * 4. Insert into payouts table and mark booking host_paid = true
 */

const INTASEND_PUBLISHABLE_KEY = process.env.INTASEND_PUBLISHABLE_KEY || ""
const INTASEND_SECRET_KEY = process.env.INTASEND_SECRET_KEY || ""
const CRON_SECRET = process.env.CRON_SECRET || ""

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ""
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

const HOST_COMMISSION_RATE = 0.80 // Host receives 80%, platform retains 20%

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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  console.log("[Payout Cron] Starting run at", new Date().toISOString())
  console.log("[Payout Cron] SUPABASE_URL:", SUPABASE_URL ? "SET" : "MISSING")
  console.log("[Payout Cron] INTASEND_SECRET_KEY:", INTASEND_SECRET_KEY ? "SET" : "MISSING")

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    console.log("[Payout Cron] Looking for bookings updated before:", twentyFourHoursAgo)

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
      .or("host_paid.is.null,host_paid.eq.false")
      .lte("updated_at", twentyFourHoursAgo)
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

    const isLive = INTASEND_PUBLISHABLE_KEY && !INTASEND_PUBLISHABLE_KEY.startsWith("ISPubKey_test")
    const intasendBaseUrl = isLive
      ? "https://payment.intasend.com/api/v1"
      : "https://sandbox.intasend.com/api/v1"

    console.log(`[Payout Cron] IntaSend mode: ${isLive ? "LIVE" : "SANDBOX"} → ${intasendBaseUrl}`)

    for (const booking of eligibleBookings) {
      console.log(`\n[Payout Cron] ─── Processing booking ${booking.id} ───`)

      const hostProfile: any = booking.host
      const hostPhone = hostProfile?.phone || booking.guest_phone
      const hostName = hostProfile?.full_name || "Ausaguide Host"
      const hostEmail = hostProfile?.email || null

      console.log(`[Payout Cron]   host_id:    ${booking.host_id}`)
      console.log(`[Payout Cron]   host_name:  ${hostName}`)
      console.log(`[Payout Cron]   host_phone: ${hostPhone ?? "MISSING"}`)
      console.log(`[Payout Cron]   host_email: ${hostEmail ?? "N/A"}`)
      console.log(`[Payout Cron]   currency:   ${booking.currency || "NULL → will use KES"}`)
      console.log(`[Payout Cron]   total_price:    ${booking.total_price}`)
      console.log(`[Payout Cron]   payment_amount: ${booking.payment_amount}`)

      // Skip if no host phone
      if (!hostPhone) {
        console.warn(`[Payout Cron]   ⚠ SKIPPED: Host phone number missing for booking ${booking.id}`)
        results.push({ booking_id: booking.id, status: "skipped", reason: "missing_host_phone" })
        continue
      }

      const totalAmount = Number(booking.payment_amount || booking.total_price || 0)
      const hostShare = Math.round(totalAmount * HOST_COMMISSION_RATE)
      const platformFee = totalAmount - hostShare
      const currency = booking.currency && booking.currency.toUpperCase() !== "USD" ? booking.currency : "KES"
      const cleanPhone = hostPhone.replace(/\s+/g, "").replace(/^\+/, "")

      console.log(`[Payout] Booking ${booking.id}: Total ${totalAmount}, Host 80% = ${hostShare}, Platform 20% = ${platformFee}`)
      console.log(`[Payout Cron]   payout_currency: ${currency}`)
      console.log(`[Payout Cron]   clean_phone: ${cleanPhone}`)

      if (hostShare <= 0) {
        console.warn(`[Payout Cron]   ⚠ SKIPPED: Payout amount is 0 for booking ${booking.id}`)
        results.push({ booking_id: booking.id, status: "skipped", reason: "zero_amount" })
        continue
      }

      const payoutBody = {
        currency,
        transactions: [
          {
            name: hostName,
            account: cleanPhone,
            amount: hostShare,
          },
        ],
      }

      console.log(`[Payout Cron]   → IntaSend request body:`, JSON.stringify(payoutBody))

      let intasendOk = false
      let trackingId = `CRON_PO_${booking.id}_${Date.now()}`
      let responseJson: any = {}

      try {
        const intasendRes = await fetch(`${intasendBaseUrl}/send-money/mpesa/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${INTASEND_SECRET_KEY}`,
          },
          body: JSON.stringify(payoutBody),
        })

        console.log(`[Payout Cron]   ← IntaSend HTTP status: ${intasendRes.status}`)

        try {
          responseJson = await intasendRes.json()
        } catch {
          responseJson = { ok: intasendRes.ok }
        }

        console.log(`[Payout Cron]   ← IntaSend response body:`, JSON.stringify(responseJson))

        if (intasendRes.ok) {
          intasendOk = true
          trackingId = responseJson.tracking_id || trackingId
        } else {
          console.error(`[Payout Cron]   ✗ IntaSend API returned error ${intasendRes.status}:`, JSON.stringify(responseJson))
        }
      } catch (fetchErr: any) {
        console.error(`[Payout Cron]   ✗ IntaSend fetch threw exception:`, fetchErr?.message)
        results.push({
          booking_id: booking.id,
          status: "failed",
          error: `IntaSend fetch error: ${fetchErr?.message}`,
        })
        continue
      }

      // ── STEP 2: Insert into payouts table ──────────────────────────────
      console.log(`[Payout Cron]   → Inserting into payouts table...`)
      const { data: payoutRow, error: payoutInsertError } = await supabase
        .from("payouts")
        .insert({
          booking_id: booking.id,
          host_id: booking.host_id,
          amount: hostShare,
          currency,
          payout_method: "mpesa",
          payout_reference: trackingId,
          status: intasendOk ? "completed" : "failed",
          intasend_response: responseJson,
          paid_at: intasendOk ? new Date().toISOString() : null,
        })
        .select("id")
        .single()

      if (payoutInsertError) {
        console.error(`[Payout Cron]   ✗ payouts insert error:`, JSON.stringify(payoutInsertError))
      } else {
        console.log(`[Payout Cron]   ✓ payouts row created: ${payoutRow?.id}`)
      }

      // ── STEP 3: Update bookings to mark host_paid ──────────────────────
      if (intasendOk) {
        console.log(`[Payout Cron]   → Marking booking ${booking.id} as host_paid = true...`)
        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            host_paid: true,
            host_payout_amount: hostShare,
            host_payout_id: trackingId,
            host_payout_at: new Date().toISOString(),
            currency, // fix USD → KES while we're here
          })
          .eq("id", booking.id)

        if (updateError) {
          console.error(`[Payout Cron]   ✗ bookings update error:`, JSON.stringify(updateError))
          results.push({
            booking_id: booking.id,
            status: "payout_sent_but_db_update_failed",
            error: updateError.message,
            tracking_id: trackingId,
          })
        } else {
          console.log(`[Payout Cron]   ✓ Booking ${booking.id} marked host_paid = true`)
          results.push({
            booking_id: booking.id,
            status: "paid",
            host_share: hostShare,
            platform_fee: platformFee,
            host_name: hostName,
            payout_id: trackingId,
            currency,
          })
        }
      } else {
        results.push({
          booking_id: booking.id,
          status: "intasend_failed",
          intasend_response: responseJson,
          tracking_id: trackingId,
        })
      }
    }

    const failedCount = results.filter(r => r.status !== "paid" && r.status !== "skipped").length
    const paidCount = results.filter(r => r.status === "paid").length

    console.log(`\n[Payout Cron] Done. Paid: ${paidCount}, Failed: ${failedCount}, Total: ${results.length}`)

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
