import type { VercelRequest, VercelResponse } from "@vercel/node"

function normalizeKenyanPhone(phone: string): string {
  const digits = String(phone || "").trim().replace(/\D/g, "")
  if (digits.startsWith("254") && digits.length === 12) return digits
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1)
  if (digits.length === 9) return "254" + digits
  return digits
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    return res.status(204).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { amount, currency = "KES", email, phone, first_name, last_name, api_ref, booking_id, bookingId } = req.body || {}

    if (!amount || !email || !phone) {
      return res.status(400).json({ error: "Missing required fields: amount, email, phone" })
    }

    const publishableKey =
      process.env.INTASEND_PUBLISHABLE_KEY ||
      process.env.INTASEND_PUBLIC_KEY ||
      process.env.VITE_INTASEND_PUBLIC_KEY ||
      ""

    const secretKey =
      process.env.INTASEND_SECRET_KEY ||
      process.env.INTASEND_API_TOKEN ||
      process.env.INTASEND_PRIVATE_KEY ||
      ""

    if (!publishableKey || !secretKey) {
      return res.status(500).json({
        error: "Payment gateway keys (INTASEND_PUBLISHABLE_KEY, INTASEND_SECRET_KEY) are not set in environment variables.",
      })
    }

    const formattedPhone = normalizeKenyanPhone(phone)
    const resolvedBookingId = booking_id || bookingId || api_ref || `BK_${Date.now()}`
    const siteUrl = process.env.SITE_URL || "https://ausaguide.com"
    const callbackUrl = `${siteUrl}/payment-success?api_ref=${resolvedBookingId}`

    const payload = {
      public_key: publishableKey,
      currency,
      amount: Math.round(Number(amount)),
      email: String(email).trim().toLowerCase(),
      phone_number: formattedPhone,
      mobile: formattedPhone,
      first_name: first_name || email.split("@")[0],
      last_name: last_name || "",
      api_ref: resolvedBookingId,
      redirect_url: callbackUrl,
      comment: `Ausaguide tour booking payment for ${resolvedBookingId}`,
    }

    const isLive = !publishableKey.startsWith("ISPubKey_test")
    const baseUrl = isLive
      ? "https://payment.intasend.com/api/v1"
      : "https://sandbox.intasend.com/api/v1"

    const response = await fetch(`${baseUrl}/checkout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secretKey}`,
      },
      body: JSON.stringify(payload),
    })

    const data: any = await response.json().catch(() => null)

    if (!response.ok) {
      const errorMsg =
        data?.message ||
        data?.detail ||
        (Array.isArray(data?.errors) ? data.errors[0]?.detail : null) ||
        (typeof data?.error === "string" ? data.error : null) ||
        `Payment initiation failed with status ${response.status}`

      return res.status(response.status).json({ error: errorMsg, details: data })
    }

    const checkoutUrl = data?.url || data?.checkout_url
    if (!checkoutUrl) {
      return res.status(502).json({ error: "No checkout URL returned by payment gateway", details: data })
    }

    return res.status(200).json({
      success: true,
      checkout_url: checkoutUrl,
      reference: resolvedBookingId,
      data,
    })
  } catch (err: any) {
    console.error("[api/create-checkout] Error:", err)
    return res.status(500).json({ error: err?.message || "Internal server error" })
  }
}
