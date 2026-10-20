import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createClient } from "@supabase/supabase-js"

/**
 * 24-Hour Post-Tour Completion Payout Processor (Direct Daraja M-Pesa B2C)
 *
 * Route: GET/POST /api/cron/process-completed-payouts
 *
 * Logic:
 * 1. Find all bookings where:
 *    - status = 'completed'
 *    - payment_status = 'paid'
 *    - host_paid = false
 *    - paid_at was more than 24 hours ago
 * 2. Fetch the host's phone number from the profiles table using host_id
 * 3. Calculate 80% of the booking amount (total_price * 0.80)
 * 4. Invoke the Supabase Edge Function mpesa-b2c-payout
 */

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

  console.log("[Payout Cron] Starting M-Pesa B2C Payout run at", new Date().toISOString())

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    console.log("[Payout Cron] Looking for completed & paid bookings with paid_at before:", twentyFourHoursAgo)

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
        host_id,
        guest_phone
      `)
      .eq("status", "completed")
      .eq("payment_status", "paid")
      .eq("host_paid", false)
      .lt("paid_at", twentyFourHoursAgo)
      .limit(50)

    if (queryError) {
      console.error("[Payout Cron] Query error:", queryError)
      return res.status(500).json({ success: false, error: queryError.message })
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
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/mpesa-b2c-payout`

    for (const booking of eligibleBookings) {
      console.log(`\n[Payout Cron] ─── Processing booking ${booking.id} ───`)

      // ── STEP 2: Fetch host phone from profiles table using host_id ───────
      let hostPhone = ""
      let hostName = "Ausaguide Host"

      if (booking.host_id) {
        const { data: hostProfile, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, phone, email")
          .eq("id", booking.host_id)
          .maybeSingle()

        if (profileError) {
          console.warn(`[Payout Cron] Error fetching profile for host ${booking.host_id}:`, profileError)
        } else if (hostProfile) {
          hostPhone = hostProfile.phone || ""
          if (hostProfile.full_name) hostName = hostProfile.full_name
        }
      }

      // Fallback: if profile didn't have phone, check guest_phone or log warning
      if (!hostPhone) {
        console.warn(`[Payout Cron] ⚠ SKIPPED: Host phone number missing in profiles for booking ${booking.id}`)
        results.push({ booking_id: booking.id, status: "skipped", reason: "missing_host_phone" })
        continue
      }

      const formattedPhone = formatKenyaPhone(hostPhone)
      if (!/^254[17]\d{8}$/.test(formattedPhone)) {
        console.warn(`[Payout Cron] ⚠ SKIPPED: Host phone "${formattedPhone}" is not a valid Kenyan number`)
        results.push({ booking_id: booking.id, status: "skipped", reason: "invalid_phone_format", phone: formattedPhone })
        continue
      }

      // ── STEP 3: Calculate 80% host payout amount ─────────────────────────
      const totalAmount = Number(booking.payment_amount || booking.total_price || 0)
      const hostShare = Math.round(totalAmount * HOST_COMMISSION_RATE)
      const platformFee = totalAmount - hostShare

      if (hostShare <= 0) {
        console.warn(`[Payout Cron] ⚠ SKIPPED: Payout amount is 0 for booking ${booking.id}`)
        results.push({ booking_id: booking.id, status: "skipped", reason: "zero_amount" })
        continue
      }

      console.log(`[Payout Cron] Booking ${booking.id}: Total ${totalAmount}, Host 80% = ${hostShare}, Platform 20% = ${platformFee}`)
      console.log(`[Payout Cron] Sending payout to ${hostName} (${formattedPhone})...`)

      // ── STEP 4: Call mpesa-b2c-payout Edge Function ──────────────────────
      const payoutPayload = {
        phone: formattedPhone,
        amount: hostShare,
        booking_id: booking.id,
        host_name: hostName,
        host_id: booking.host_id,
      }

      try {
        const edgeRes = await fetch(edgeFunctionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
          },
          body: JSON.stringify(payoutPayload),
        })

        const edgeData = await edgeRes.json().catch(() => ({}))
        console.log(`[Payout Cron] Edge Function response (HTTP ${edgeRes.status}):`, edgeData)

        const isSuccess = edgeRes.ok && (edgeData.ResponseCode === "0" || edgeData.ConversationID)

        if (isSuccess) {
          results.push({
            booking_id: booking.id,
            status: "initiated",
            amount: hostShare,
            host_name: hostName,
            phone: formattedPhone,
            conversation_id: edgeData.ConversationID,
            originator_conversation_id: edgeData.OriginatorConversationID,
          })
        } else {
          console.error(`[Payout Cron] ✗ Payout rejected by M-Pesa B2C:`, edgeData)
          results.push({
            booking_id: booking.id,
            status: "failed",
            error: edgeData.errorMessage || edgeData.ResponseDescription || edgeData.error || `HTTP ${edgeRes.status}`,
            details: edgeData,
          })
        }
      } catch (callErr: any) {
        console.error(`[Payout Cron] ✗ Error calling mpesa-b2c-payout for booking ${booking.id}:`, callErr)
        results.push({
          booking_id: booking.id,
          status: "failed",
          error: callErr.message || "Failed to call mpesa-b2c-payout edge function",
        })
      }
    }

    const initiatedCount = results.filter((r) => r.status === "initiated").length
    const failedCount = results.filter((r) => r.status === "failed").length

    console.log(`\n[Payout Cron] Finished run. Initiated: ${initiatedCount}, Failed: ${failedCount}, Total: ${results.length}`)

    return res.status(200).json({
      success: failedCount === 0,
      processed_count: results.length,
      initiated_count: initiatedCount,
      failed_count: failedCount,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (err: any) {
    console.error("[Payout Cron] Unhandled handler error:", err)
    return res.status(500).json({ success: false, error: err?.message || "Internal cron error" })
  }
}
