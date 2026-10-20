import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import crypto from "node:crypto"
import { Buffer } from "node:buffer"

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
 * Formats the public certificate string into standard PEM format.
 * Handles:
 *  - Multiline or single-line PEM with literal '\n'
 *  - Raw base64 DER certificate strings without headers
 */
function formatCertificate(rawCert: string): string {
  let cert = rawCert.trim()
  // Replace literal '\n' characters with actual line breaks
  cert = cert.replace(/\\n/g, "\n")

  if (cert.includes("-----BEGIN CERTIFICATE-----") || cert.includes("-----BEGIN PUBLIC KEY-----")) {
    return cert
  }

  // Pure base64 string: chunk into 64-character lines and wrap in PEM boundaries
  const cleaned = cert.replace(/\s+/g, "")
  const lines = cleaned.match(/.{1,64}/g)?.join("\n") || cleaned
  return `-----BEGIN CERTIFICATE-----\n${lines}\n-----END CERTIFICATE-----\n`
}

/**
 * Generates Safaricom Daraja SecurityCredential by RSA-encrypting the initiator password
 * with the Safaricom X.509 public certificate using PKCS#1 v1.5 padding.
 */
function generateSecurityCredential(initiatorPassword: string, rawCert: string): string {
  const pemCert = formatCertificate(rawCert)
  const passwordBuffer = Buffer.from(initiatorPassword, "utf-8")

  const encrypted = crypto.publicEncrypt(
    {
      key: pemCert,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    passwordBuffer
  )

  return encrypted.toString("base64")
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
    const body = await req.json()
    const { phone, amount, booking_id, host_name, host_id } = body

    console.log(`[M-Pesa B2C] Request received for booking "${booking_id}" — Amount: KES ${amount}`)

    // 1. Validation
    if (!phone || !amount || !booking_id) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: phone, amount, and booking_id are required.",
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
      return new Response(
        JSON.stringify({
          error: `Invalid Kenyan phone number format: "${phone}". Expected 2547XXXXXXXX or 2541XXXXXXXX.`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    if (!numericAmount || numericAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Amount must be a positive integer." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // 2. Environment Variables
    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY")
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET")
    const initiatorName = Deno.env.get("MPESA_INITIATOR_NAME")
    const initiatorPassword = Deno.env.get("MPESA_INITIATOR_PASSWORD")
    const certificate = Deno.env.get("MPESA_CERTIFICATE") || Deno.env.get("MPESA_PUBLIC_CERT")
    const shortcode = Deno.env.get("MPESA_B2C_SHORTCODE") || Deno.env.get("MPESA_SHORTCODE") || "1327856"
    const mpesaEnv = (Deno.env.get("MPESA_ENVIRONMENT") || "production").toLowerCase().trim()

    const missingConfigs: string[] = []
    if (!consumerKey) missingConfigs.push("MPESA_CONSUMER_KEY")
    if (!consumerSecret) missingConfigs.push("MPESA_CONSUMER_SECRET")
    if (!initiatorName) missingConfigs.push("MPESA_INITIATOR_NAME")
    if (!initiatorPassword) missingConfigs.push("MPESA_INITIATOR_PASSWORD")
    if (!certificate) missingConfigs.push("MPESA_CERTIFICATE")

    if (missingConfigs.length > 0) {
      console.error(`[M-Pesa B2C] Missing required environment variables: ${missingConfigs.join(", ")}`)
      return new Response(
        JSON.stringify({
          error: `Server configuration error: missing ${missingConfigs.join(", ")}`,
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

    // 3. Generate SecurityCredential
    let securityCredential = ""
    try {
      securityCredential = generateSecurityCredential(initiatorPassword!, certificate!)
      console.log("[M-Pesa B2C] Generated SecurityCredential successfully")
    } catch (certErr: any) {
      console.error("[M-Pesa B2C] Failed to generate SecurityCredential:", certErr)
      return new Response(
        JSON.stringify({
          error: "Failed to generate M-Pesa SecurityCredential from provided certificate.",
          details: certErr.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // 4. Fetch OAuth Token via Basic Auth
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

    // 5. Build B2C Payment Request
    const b2cUrl = `${baseUrl}/mpesa/b2c/v1/paymentrequest`
    const callbackUrl =
      Deno.env.get("MPESA_B2C_CALLBACK_URL") ||
      "https://sdbvvcjnlergsmcsorrv.supabase.co/functions/v1/mpesa-b2c-callback"

    const b2cPayload = {
      InitiatorName: initiatorName,
      SecurityCredential: securityCredential,
      CommandID: "BusinessPayment",
      Amount: numericAmount,
      PartyA: shortcode,
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

    // 6. Record in Supabase payouts table
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
    } else {
      console.log(`[M-Pesa B2C] Payout row inserted (status: ${isAccepted ? "processing" : "failed"})`)
    }

    // Return the response to the caller (e.g. cron)
    return new Response(JSON.stringify(b2cData), {
      status: isAccepted ? 200 : b2cResponse.status || 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("[M-Pesa B2C] Unexpected error:", error)
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
