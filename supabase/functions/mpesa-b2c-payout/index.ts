import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

/**
 * Normalizes Kenyan phone numbers to standard 2547XXXXXXXX or 2541XXXXXXXX format
 */
function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("254") && digits.length === 12) return digits
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1)
  if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) return "254" + digits
  return digits
}

/**
 * Helper to log errors to public.error_logs
 * Schema: id, user_email, error_context, error_message, metadata, created_at
 */
async function logErrorToDb({
  errorContext,
  errorMessage,
  userEmail,
  metadata,
  bookingId,
}: {
  errorContext: string
  errorMessage: string
  userEmail?: string | null
  metadata?: any
  bookingId?: string | null
}) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    if (!supabaseUrl || !supabaseKey) return

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    let resolvedEmail = userEmail || null
    if (!resolvedEmail && bookingId && bookingId.length === 36) {
      try {
        const { data } = await supabase
          .from("bookings")
          .select("guest_email")
          .eq("id", bookingId)
          .maybeSingle()
        if (data?.guest_email) resolvedEmail = data.guest_email
      } catch (_) {}
    }

    await supabase.from("error_logs").insert({
      user_email: resolvedEmail,
      error_context: errorContext,
      error_message: errorMessage,
      metadata: {
        ...(metadata || {}),
        booking_id: bookingId || null,
      },
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

  let currentBookingId: string | undefined = undefined
  let currentEmail: string | undefined = undefined

  try {
    const body = await req.json()
    const { phone, amount, booking_id, host_name, host_id, email, user_email } = body
    currentBookingId = booking_id
    currentEmail = email || user_email

    console.log(`[M-Pesa B2C] Request received for booking "${booking_id}" — Amount: KES ${amount}`)

    // 1. Validation
    if (!phone || !amount || !booking_id) {
      const err = "Missing required fields: phone, amount, and booking_id are required."
      await logErrorToDb({
        errorContext: "mpesa-b2c-payout:validation",
        errorMessage: err,
        userEmail: currentEmail,
        metadata: { phone, amount, booking_id },
        bookingId: booking_id,
      })
      return new Response(
        JSON.stringify({
          error: err,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const formattedPhone = normalizePhoneNumber(String(phone))
    const numericAmount = Math.round(Number(amount))

    if (!/^254[17]\d{8}$/.test(formattedPhone)) {
      const err = `Invalid Kenyan phone number format: "${phone}". Expected 2547XXXXXXXX or 2541XXXXXXXX.`
      await logErrorToDb({
        errorContext: "mpesa-b2c-payout:validation",
        errorMessage: err,
        userEmail: currentEmail,
        metadata: { rawPhone: phone, formattedPhone },
        bookingId: booking_id,
      })
      return new Response(
        JSON.stringify({
          error: err,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    if (!numericAmount || numericAmount <= 0) {
      const err = "Amount must be a positive integer."
      await logErrorToDb({
        errorContext: "mpesa-b2c-payout:validation",
        errorMessage: err,
        userEmail: currentEmail,
        metadata: { amount, numericAmount },
        bookingId: booking_id,
      })
      return new Response(
        JSON.stringify({ error: err }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // 2. Read Environment Variables directly from Supabase Secrets
    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY")
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET")
    const initiatorName = Deno.env.get("MPESA_INITIATOR_NAME")
    const securityCredential = Deno.env.get("MPESA_SECURITY_CREDENTIAL")
    const shortcode = Deno.env.get("MPESA_B2C_SHORTCODE") || Deno.env.get("MPESA_SHORTCODE") || "1327856"
    const mpesaEnv = (Deno.env.get("MPESA_ENVIRONMENT") || "production").toLowerCase().trim()

    const missingConfigs: string[] = []
    if (!consumerKey) missingConfigs.push("MPESA_CONSUMER_KEY")
    if (!consumerSecret) missingConfigs.push("MPESA_CONSUMER_SECRET")
    if (!initiatorName) missingConfigs.push("MPESA_INITIATOR_NAME")
    if (!securityCredential) missingConfigs.push("MPESA_SECURITY_CREDENTIAL")

    if (missingConfigs.length > 0) {
      const err = `Server configuration error: missing ${missingConfigs.join(", ")}`
      console.error(`[M-Pesa B2C] ${err}`)
      await logErrorToDb({
        errorContext: "mpesa-b2c-payout:config",
        errorMessage: err,
        userEmail: currentEmail,
        metadata: { missingConfigs },
        bookingId: booking_id,
      })
      return new Response(
        JSON.stringify({
          error: err,
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

    // 3. Fetch OAuth Token via Basic Auth
    const authString = btoa(`${consumerKey}:${consumerSecret}`)
    const authUrl = `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`

    console.log(`[M-Pesa B2C] Requesting OAuth token from ${authUrl}`)
    const tokenResponse = await fetch(authUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${authString}`,
      },
    })

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text()
      console.error("[M-Pesa B2C] OAuth token fetch failed:", errText)
      await logErrorToDb({
        errorContext: "mpesa-b2c-payout:oauth",
        errorMessage: "Failed to authenticate with Safaricom Daraja API.",
        userEmail: currentEmail,
        metadata: { status: tokenResponse.status, details: errText },
        bookingId: booking_id,
      })
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
      const err = "Access token missing from Safaricom OAuth response."
      await logErrorToDb({
        errorContext: "mpesa-b2c-payout:oauth",
        errorMessage: err,
        userEmail: currentEmail,
        metadata: { tokenData },
        bookingId: booking_id,
      })
      throw new Error(err)
    }

    // 4. Build B2C Payment Request
    const b2cUrl = `${baseUrl}/mpesa/b2c/v1/paymentrequest`
    const callbackUrl =
      Deno.env.get("MPESA_B2C_CALLBACK_URL") ||
      "https://sdbvvcjnlergsmcsorrv.supabase.co/functions/v1/mpesa-b2c-callback"

    const b2cPayload = {
      InitiatorName: initiatorName.trim(),
      SecurityCredential: securityCredential.trim(),
      CommandID: "BusinessPayment",
      Amount: numericAmount,
      PartyA: shortcode.trim(),
      PartyB: formattedPhone,
      Remarks: "Ausaguide Host Payout",
      QueueTimeOutURL: callbackUrl,
      ResultURL: callbackUrl,
      Occasion: "Ausaguide Payout",
      OriginatorConversationID: String(booking_id),
    }

    console.log(
      `[M-Pesa B2C] Initiating B2C payout of KES ${numericAmount} to ${formattedPhone}` +
      ` (PartyA: ${shortcode}, Initiator: ${initiatorName}, BookingID: ${booking_id})`
    )

    const b2cResponse = await fetch(b2cUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(b2cPayload),
    })

    const b2cData = await b2cResponse.json()
    console.log("[M-Pesa B2C] Response from Safaricom:", JSON.stringify(b2cData))

    const isAccepted = b2cResponse.ok && (b2cData.ResponseCode === "0" || b2cData.ConversationID)

    if (!isAccepted) {
      await logErrorToDb({
        errorContext: "mpesa-b2c-payout:daraja_rejection",
        errorMessage: b2cData.errorMessage || b2cData.ResponseDescription || "Safaricom B2C rejected the payout request",
        userEmail: currentEmail,
        metadata: { b2cData, phone: formattedPhone, amount: numericAmount },
        bookingId: booking_id,
      })
    }

    // 5. Record in Supabase payouts table
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // Resolve host_id if not explicitly provided
    let resolvedHostId = host_id
    if (!resolvedHostId) {
      const { data: bData } = await supabase
        .from("bookings")
        .select("host_id")
        .eq("id", booking_id)
        .maybeSingle()
      resolvedHostId = bData?.host_id || null
    }

    const trackingId = b2cData.ConversationID || b2cData.OriginatorConversationID || `B2C_${booking_id}`

    // Insert payout record tracking the request
    try {
      const { error: payoutInsertError } = await supabase
        .from("payouts")
        .insert({
          booking_id: booking_id,
          host_id: resolvedHostId,
          amount: numericAmount,
          currency: "KES",
          status: isAccepted ? "processing" : "failed",
          payout_method: "mpesa",
          recipient_phone: formattedPhone,
          recipient_name: host_name || "Ausaguide Host",
          gateway_reference: b2cData.OriginatorConversationID || booking_id,
          tracking_id: trackingId,
          failure_reason: isAccepted ? null : (b2cData.errorMessage || b2cData.ResponseDescription || "Safaricom B2C rejected"),
          metadata: {
            b2c_request: {
              PartyA: shortcode,
              PartyB: formattedPhone,
              Amount: numericAmount,
              CommandID: "BusinessPayment",
            },
            b2c_response: b2cData,
          },
          processed_at: new Date().toISOString(),
        })

      if (payoutInsertError) {
        console.error("[M-Pesa B2C] Failed to record payout row:", payoutInsertError)
        await logErrorToDb({
          errorContext: "mpesa-b2c-payout:db_insert",
          errorMessage: "Failed to insert payout tracking record into database",
          userEmail: currentEmail,
          metadata: { payoutInsertError },
          bookingId: booking_id,
        })
      } else {
        console.log(`[M-Pesa B2C] Payout row inserted (status: ${isAccepted ? "processing" : "failed"})`)
      }
    } catch (insertErr) {
      console.error("[M-Pesa B2C] Exception inserting payout row:", insertErr)
      await logErrorToDb({
        errorContext: "mpesa-b2c-payout:db_exception",
        errorMessage: "Exception inserting payout row",
        userEmail: currentEmail,
        metadata: { error: String(insertErr) },
        bookingId: booking_id,
      })
    }

    // Return the response to the caller (e.g. cron)
    return new Response(JSON.stringify(b2cData), {
      status: isAccepted ? 200 : b2cResponse.status || 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("[M-Pesa B2C] Unexpected error:", error)
    await logErrorToDb({
      errorContext: "mpesa-b2c-payout:catch",
      errorMessage: error.message || "An unexpected error occurred during M-Pesa B2C payout.",
      userEmail: currentEmail,
      metadata: { stack: error.stack },
      bookingId: currentBookingId,
    })
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred during M-Pesa B2C payout.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
