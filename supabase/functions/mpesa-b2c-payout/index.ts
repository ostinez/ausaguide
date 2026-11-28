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

    console.log(`[M-Pesa B2C] Step 1 - Request received:`, JSON.stringify({
      booking_id,
      host_id,
      phone: phone ? "***" + String(phone).slice(-4) : null,
      amount,
    }))

    // 1. Basic validation: booking_id is always required
    if (!booking_id) {
      const err = "Missing required field: booking_id is required."
      console.error("[M-Pesa B2C] Validation error:", err)
      await logErrorToDb({
        errorContext: "mpesa-b2c-payout:validation",
        errorMessage: err,
        userEmail: currentEmail,
        metadata: { phone, amount, booking_id },
        bookingId: booking_id,
      })
      return new Response(
        JSON.stringify({ error: err }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Initialize Supabase admin client early so we can fetch booking & host details
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // 2. Fetch booking details from the database
    console.log(`[M-Pesa B2C] Step 2 - Fetching booking details for booking_id=${booking_id}`)
    const { data: bookingRecord, error: bookingFetchError } = await supabase
      .from("bookings")
      .select("id, host_id, total_price, payment_amount, guest_phone, guest_email, status, host_paid")
      .eq("id", booking_id)
      .maybeSingle()

    if (bookingFetchError) {
      console.error("[M-Pesa B2C] Failed to fetch booking from DB:", bookingFetchError.message || bookingFetchError)
      throw new Error(`Database error fetching booking: ${bookingFetchError.message}`)
    }

    if (!bookingRecord) {
      const err = `Booking not found for id: ${booking_id}`
      console.error("[M-Pesa B2C]", err)
      return new Response(
        JSON.stringify({ error: err }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log(`[M-Pesa B2C] Booking fetched:`, JSON.stringify({
      id: bookingRecord.id,
      host_id: bookingRecord.host_id,
      status: bookingRecord.status,
      host_paid: bookingRecord.host_paid,
      total_price: bookingRecord.total_price,
      payment_amount: bookingRecord.payment_amount,
    }))

    const resolvedHostId = host_id || bookingRecord.host_id
    if (!currentEmail && bookingRecord.guest_email) {
      currentEmail = bookingRecord.guest_email
    }

    // Resolve host phone & name from profiles if not provided in request
    let rawPhone = phone
    let resolvedHostName = host_name
    if ((!rawPhone || !resolvedHostName) && resolvedHostId) {
      const { data: hostProfile, error: hostProfErr } = await supabase
        .from("profiles")
        .select("full_name, phone, mpesa_phone")
        .eq("id", resolvedHostId)
        .maybeSingle()

      if (hostProfErr) {
        console.warn("[M-Pesa B2C] Could not fetch host profile:", hostProfErr.message)
      } else if (hostProfile) {
        if (!rawPhone) rawPhone = hostProfile.mpesa_phone || hostProfile.phone
        if (!resolvedHostName) resolvedHostName = hostProfile.full_name
      }
    }

    if (!rawPhone) {
      const err = "Missing host phone number: neither request nor host profile has an M-Pesa phone number."
      console.error("[M-Pesa B2C] Validation error:", err)
      await logErrorToDb({
        errorContext: "mpesa-b2c-payout:validation",
        errorMessage: err,
        userEmail: currentEmail,
        metadata: { booking_id, resolvedHostId },
        bookingId: booking_id,
      })
      return new Response(
        JSON.stringify({ error: err }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const formattedPhone = normalizePhoneNumber(String(rawPhone))
    // Default to 80% of booking total if amount was not explicitly provided
    const rawAmount = amount !== undefined && amount !== null
      ? Number(amount)
      : Number(bookingRecord.payment_amount || bookingRecord.total_price || 0) * 0.80
    const numericAmount = Math.round(rawAmount)

    if (!/^254[17]\d{8}$/.test(formattedPhone)) {
      const err = `Invalid Kenyan phone number format: "${rawPhone}". Expected 2547XXXXXXXX or 2541XXXXXXXX.`
      console.error("[M-Pesa B2C] Validation error:", err)
      await logErrorToDb({
        errorContext: "mpesa-b2c-payout:validation",
        errorMessage: err,
        userEmail: currentEmail,
        metadata: { rawPhone, formattedPhone },
        bookingId: booking_id,
      })
      return new Response(
        JSON.stringify({ error: err }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (!numericAmount || numericAmount <= 0) {
      const err = `Amount must be a positive integer. Computed: ${numericAmount}`
      console.error("[M-Pesa B2C] Validation error:", err)
      await logErrorToDb({
        errorContext: "mpesa-b2c-payout:validation",
        errorMessage: err,
        userEmail: currentEmail,
        metadata: { amount, numericAmount },
        bookingId: booking_id,
      })
      return new Response(
        JSON.stringify({ error: err }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // 3. Fetch OAuth Token & Send B2C Payment Request
    const b2cUrl = `${baseUrl}/mpesa/b2c/v1/paymentrequest`
    const callbackUrl =
      Deno.env.get("MPESA_B2C_CALLBACK_URL") ||
      "https://sdbvvcjnlergsmcsorrv.supabase.co/functions/v1/mpesa-b2c-callback"

    let accessToken = ""
    let b2cResponse: Response
    let b2cData: any = {}

    try {
      console.log(`[M-Pesa B2C] Step 3 - Generating Safaricom OAuth token (env=${mpesaEnv}, url=${authUrl})`)
      const tokenResponse = await fetch(authUrl, {
        method: "GET",
        headers: {
          Authorization: `Basic ${authString}`,
        },
      })

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text()
        console.error(`[M-Pesa B2C] OAuth token fetch failed (HTTP ${tokenResponse.status}):`, errText)
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
      accessToken = tokenData.access_token

      if (!accessToken) {
        const err = "Access token missing from Safaricom OAuth response."
        console.error("[M-Pesa B2C] OAuth error:", err, JSON.stringify(tokenData))
        await logErrorToDb({
          errorContext: "mpesa-b2c-payout:oauth",
          errorMessage: err,
          userEmail: currentEmail,
          metadata: { tokenData },
          bookingId: booking_id,
        })
        throw new Error(err)
      }
      console.log("[M-Pesa B2C] Step 3 complete - OAuth token acquired successfully.")

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
        `[M-Pesa B2C] Step 4 - Constructed B2C payload:`,
        JSON.stringify({
          env: mpesaEnv,
          b2cUrl,
          CommandID: b2cPayload.CommandID,
          Amount: b2cPayload.Amount,
          PartyA: b2cPayload.PartyA,
          PartyB: b2cPayload.PartyB,
          InitiatorName: b2cPayload.InitiatorName,
          SecurityCredentialLength: b2cPayload.SecurityCredential.length,
          OriginatorConversationID: b2cPayload.OriginatorConversationID,
        })
      )

      b2cResponse = await fetch(b2cUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(b2cPayload),
      })

      const b2cRawText = await b2cResponse.text()
      try {
        b2cData = JSON.parse(b2cRawText || "{}")
      } catch {
        b2cData = { raw: b2cRawText }
      }
      console.log(`[M-Pesa B2C] Step 5 - Response from Safaricom (HTTP ${b2cResponse.status}):`, JSON.stringify(b2cData))
    } catch (safaricomErr: any) {
      console.error("[M-Pesa B2C] Safaricom API call threw an exception:", safaricomErr?.message || safaricomErr)
      await logErrorToDb({
        errorContext: "mpesa-b2c-payout:safaricom_exception",
        errorMessage: safaricomErr?.message || "Safaricom API call failed",
        userEmail: currentEmail,
        metadata: { stack: safaricomErr?.stack },
        bookingId: booking_id,
      })
      return new Response(
        JSON.stringify({ error: safaricomErr?.message || "Safaricom API call failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const isAccepted = b2cResponse.ok && (b2cData.ResponseCode === "0" || Boolean(b2cData.ConversationID))

    if (!isAccepted) {
      console.error("[M-Pesa B2C] Safaricom rejected B2C request:", JSON.stringify(b2cData))
      await logErrorToDb({
        errorContext: "mpesa-b2c-payout:daraja_rejection",
        errorMessage: b2cData.errorMessage || b2cData.ResponseDescription || "Safaricom B2C rejected the payout request",
        userEmail: currentEmail,
        metadata: { b2cData, phone: formattedPhone, amount: numericAmount },
        bookingId: booking_id,
      })
    }

    const trackingId = b2cData.ConversationID || b2cData.OriginatorConversationID || `B2C_${booking_id}`

    // 6. Update bookings table & insert payout tracking record
    try {
      console.log(`[M-Pesa B2C] Step 6 - Updating bookings table (id=${booking_id}) to status='completed', host_paid=${isAccepted}`)
      if (isAccepted) {
        const { error: bookingUpdateError } = await supabase
          .from("bookings")
          .update({
            status: "completed",
            host_paid: true,
            host_payout_amount: numericAmount,
            host_payout_id: trackingId,
            host_payout_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", booking_id)

        if (bookingUpdateError) {
          console.error("[M-Pesa B2C] Failed to update bookings table:", bookingUpdateError.message || bookingUpdateError)
          throw bookingUpdateError
        }
        console.log(`[M-Pesa B2C] Bookings table updated successfully for ${booking_id}.`)
      }

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
          recipient_name: resolvedHostName || "Ausaguide Host",
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
        console.error("[M-Pesa B2C] Failed to record payout row:", payoutInsertError.message || payoutInsertError)
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
    } catch (dbErr: any) {
      console.error("[M-Pesa B2C] Database update error:", dbErr?.message || dbErr)
      await logErrorToDb({
        errorContext: "mpesa-b2c-payout:db_exception",
        errorMessage: dbErr?.message || "Database update failed during payout",
        userEmail: currentEmail,
        metadata: { error: String(dbErr) },
        bookingId: booking_id,
      })
      if (isAccepted) {
        return new Response(
          JSON.stringify({
            error: `Safaricom payout accepted (${trackingId}), but database update failed: ${dbErr?.message || dbErr}`,
            b2cData,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
    }

    return new Response(JSON.stringify({ ...b2cData, success: isAccepted, payout_amount: numericAmount }), {
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
