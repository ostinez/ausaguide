import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

/**
 * Helper to log errors to the public.error_logs table
 */
async function logErrorToDb(service: string, errorMessage: string, details?: any, bookingId?: string) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    if (!supabaseUrl || !supabaseKey) return

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // Only set booking_id if it matches a UUID format, otherwise preserve in details
    const isUuid = bookingId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId)

    await supabase.from("error_logs").insert({
      service,
      error_message: errorMessage,
      details: {
        ...(details || {}),
        raw_booking_reference: bookingId || null,
      },
      booking_id: isUuid ? bookingId : null,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[error_logs] Failed to log error to database:", err)
  }
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

  let requestRef: string | undefined = undefined

  try {
    const { phone, amount, reference } = await req.json()
    requestRef = reference

    // 1. Validation
    if (!phone || !amount || !reference) {
      await logErrorToDb(
        "mpesa-stk-push",
        "Missing required fields: phone, amount, and reference are required.",
        { phone, amount, reference },
        reference
      )
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
      await logErrorToDb(
        "mpesa-stk-push",
        "Amount must be a positive number.",
        { amount, numericAmount, reference },
        reference
      )
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
      const configErrMsg = "Server configuration error: M-Pesa credentials not configured."
      console.error("[M-Pesa STK Push] " + configErrMsg)
      await logErrorToDb(
        "mpesa-stk-push",
        configErrMsg,
        { hasKey: !!consumerKey, hasSecret: !!consumerSecret, hasPasskey: !!passkey },
        reference
      )
      return new Response(
        JSON.stringify({
          error: configErrMsg,
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
      await logErrorToDb(
        "mpesa-stk-push",
        "Failed to authenticate with Safaricom Daraja API.",
        { status: tokenResponse.status, details: errText },
        reference
      )
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
      await logErrorToDb(
        "mpesa-stk-push",
        "Access token missing from Safaricom OAuth response.",
        { tokenData },
        reference
      )
      throw new Error("Access token missing from Safaricom OAuth response.")
    }

    // 3. Generate Timestamp and Password
    const timestamp = getMpesaTimestamp()
    const password = btoa(`${shortcode}${passkey}${timestamp}`)

    // 4. Build STK Push request
    const accountReference = "AUSAGUIDE"

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
      AccountReference: accountReference,
      TransactionDesc: "Ausaguide Booking",
    }

    console.log(
      `[M-Pesa STK Push] Sending STK push to ${formattedPhone} for KES ${numericAmount}` +
      ` (BookingID: ${reference}, AccountRef: ${accountReference})`
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
    console.log("[M-Pesa STK Push] Response from Safaricom:", JSON.stringify(stkData))

    // If Safaricom rejected or returned non-zero ResponseCode
    if (stkData.ResponseCode && stkData.ResponseCode !== "0") {
      await logErrorToDb(
        "mpesa-stk-push",
        stkData.ResponseDescription || "Safaricom STK push was not accepted",
        { stkData, phone: formattedPhone, amount: numericAmount },
        reference
      )
    }

    // 5. If Safaricom accepted the push (ResponseCode === "0"), save the CheckoutRequestID
    if (stkData.ResponseCode === "0" && stkData.CheckoutRequestID) {
      const checkoutRequestId: string = stkData.CheckoutRequestID

      console.log(
        `[M-Pesa STK Push] Saving CheckoutRequestID "${checkoutRequestId}" to booking ${reference}`
      )

      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      })

      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          payment_reference: checkoutRequestId,
          payment_status: "pending",
        })
        .eq("id", reference)

      if (updateError) {
        console.error(
          `[M-Pesa STK Push] Warning: failed to save CheckoutRequestID to booking ${reference}:`,
          updateError
        )
        await logErrorToDb(
          "mpesa-stk-push",
          "Failed to save CheckoutRequestID to booking",
          { updateError, checkoutRequestId },
          reference
        )
      } else {
        console.log(
          `[M-Pesa STK Push] booking ${reference}.payment_reference = "${checkoutRequestId}"`
        )
      }
    }

    // 6. Return Safaricom's raw response to the frontend
    return new Response(JSON.stringify(stkData), {
      status: stkResponse.ok ? 200 : stkResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("[M-Pesa STK Push] Unexpected error:", error)
    await logErrorToDb(
      "mpesa-stk-push",
      error.message || "An unexpected error occurred during STK push.",
      { stack: error.stack },
      requestRef
    )
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
