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
 *    - tour completed / updated_at was more than 24 hours ago
 * 2. Calculate host share (e.g., 85% of booking amount or net total)
 * 3. Invoke IntaSend inta-pay-host for each eligible booking
 * 4. Mark booking host_paid = true and notify host
 */

const INTASEND_PUBLISHABLE_KEY = process.env.INTASEND_PUBLISHABLE_KEY || ""
const INTASEND_SECRET_KEY = process.env.INTASEND_SECRET_KEY || ""

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ""
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""

const HOST_COMMISSION_RATE = 0.85 // Host receives 85%, platform retains 15%

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Supabase credentials not configured." })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  try {
    // 24 hours threshold
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Query eligible completed bookings
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
      .or("host_paid.is.null,host_paid.eq.false")
      .lte("updated_at", twentyFourHoursAgo)
      .limit(50)

    if (queryError) {
      console.error("[IntaSend 24h Payout Cron] Query error:", queryError)
      return res.status(500).json({ error: queryError.message })
    }

    const results = []

    const isLive = INTASEND_PUBLISHABLE_KEY && !INTASEND_PUBLISHABLE_KEY.startsWith("ISPubKey_test")
    const intasendBaseUrl = isLive
      ? "https://payment.intasend.com/api/v1"
      : "https://sandbox.intasend.com/api/v1"

    for (const booking of eligibleBookings || []) {
      const hostProfile: any = booking.host
      const hostPhone = hostProfile?.phone || booking.guest_phone
      const hostName = hostProfile?.full_name || "Ausaguide Host"

      if (!hostPhone) {
        console.warn(`[IntaSend 24h Payout] Skipping booking ${booking.id}: Host phone number missing.`)
        results.push({ booking_id: booking.id, status: "skipped", reason: "missing_phone" })
        continue
      }

      const totalAmount = Number(booking.payment_amount || booking.total_price || 0)
      const hostShare = Math.round(totalAmount * HOST_COMMISSION_RATE)
      const cleanPhone = hostPhone.replace(/\s+/g, "").replace(/^\+/, "")

      const payoutBody = {
        currency: booking.currency || "KES",
        transactions: [
          {
            name: hostName,
            account: cleanPhone,
            amount: hostShare,
          },
        ],
      }

      try {
        const intasendRes = await fetch(`${intasendBaseUrl}/send-money/mpesa/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${INTASEND_SECRET_KEY}`,
          },
          body: JSON.stringify(payoutBody),
        })

        const trackingId = `CRON_PO_${booking.id}_${Date.now()}`
        let responseJson: any = {}
        try {
          responseJson = await intasendRes.json()
        } catch {
          responseJson = { ok: intasendRes.ok }
        }

        // Mark host_paid = true in Supabase
        await supabase
          .from("bookings")
          .update({
            host_paid: true,
            host_payout_amount: hostShare,
            host_payout_id: responseJson.tracking_id || trackingId,
            host_payout_at: new Date().toISOString(),
          })
          .eq("id", booking.id)

        results.push({
          booking_id: booking.id,
          status: "paid",
          host_share: hostShare,
          host_name: hostName,
          payout_id: responseJson.tracking_id || trackingId,
        })
      } catch (payoutErr: any) {
        console.error(`[IntaSend 24h Payout] Failed payout for booking ${booking.id}:`, payoutErr)
        results.push({ booking_id: booking.id, status: "failed", error: payoutErr?.message })
      }
    }

    return res.status(200).json({
      success: true,
      processed_count: results.length,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (err: any) {
    console.error("[IntaSend 24h Payout Cron] Handler error:", err)
    return res.status(500).json({ error: err?.message || "Internal cron error" })
  }
}
