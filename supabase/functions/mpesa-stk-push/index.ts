import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

/**
 * Normalizes phone numbers to standard 2547XXXXXXXX or 2541XXXXXXXX format
 */
function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("254") && digits.length === 12) return digits
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1)
  if (digits.length === 9) return "254" + digits
  return digits
}

/**
 * Generates Daraja Timestamp in format YYYYMMDDHHmmss
 */
function getMpesaTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const { phone, amount, reference } = await req.json()

    // 1. Validation
    if (!phone || !amount || !reference) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: phone, amount, and reference are required.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const formattedPhone = normalizePhoneNumber(String(phone))
    const numericAmount = Math.round(Number(amount))

    if (!numericAmount || numericAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Amount must be a positive number." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Environment variables
    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY")
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET")
    const passkey = Deno.env.get("MPESA_PASSKEY")
    const shortcode = Deno.env.get("MPESA_SHORTCODE") || "1327856"
    const mpesaEnv = (Deno.env.get("MPESA_ENVIRONMENT") || "production").toLowerCase().trim()

    if (!consumerKey || !consumerSecret || !passkey) {
      console.error("[M-Pesa STK Push] Missing required credentials in environment variables.")
      return new Response(
        JSON.stringify({
          error: "Server configuration error: M-Pesa credentials not configured.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const baseUrl =
      mpesaEnv === "sandbox"
        ? "https://sandbox.safaricom.co.ke"
        : "https://api.safaricom.co.ke"

    // 2. Fetch OAuth Token via Basic Auth
    const authString = btoa(`${consumerKey}:${consumerSecret}`)
    const authUrl = `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`

    console.log(`[M-Pesa STK Push] Fetching OAuth token from ${authUrl}`)

    const tokenResponse = await fetch(authUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${authString}`,
      },
    })

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text()
      console.error("[M-Pesa STK Push] OAuth token fetch failed:", errText)
      return new Response(
        JSON.stringify({
          error: "Failed to authenticate with Safaricom Daraja API.",
          details: errText,
        }),
        {
          status: tokenResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new Error("Access token missing from Safaricom OAuth response.")
    }

    // 3. Generate Timestamp and Password
    const timestamp = getMpesaTimestamp()
    const password = btoa(`${shortcode}${passkey}${timestamp}`)

    // 4. Send STK Push request
    const stkUrl = `${baseUrl}/mpesa/stkpush/v1/processrequest`
    const callbackUrl =
      Deno.env.get("MPESA_CALLBACK_URL") ||
      "https://sdbvvcjnlergsmcsorrv.supabase.co/functions/v1/mpesa-callback"

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: numericAmount,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: reference,
      TransactionDesc: "Ausaguide Booking",
    }

    console.log(
      `[M-Pesa STK Push] Sending STK push to ${formattedPhone} for KES ${numericAmount} (Ref: ${reference})`
    )

    const stkResponse = await fetch(stkUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPayload),
    })

    const stkData = await stkResponse.json()
    console.log("[M-Pesa STK Push] Response from Safaricom:", stkData)

    // 5. Return response from Safaricom to the frontend
    return new Response(JSON.stringify(stkData), {
      status: stkResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("[M-Pesa STK Push] Unexpected error:", error)
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred during STK push.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
