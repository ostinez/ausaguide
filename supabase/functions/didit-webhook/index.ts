// @ts-nocheck -- Deno edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature-v2, x-timestamp",
}

// Float shortening helper for V2 canonicalisation
function shortenFloats(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shortenFloats)
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, shortenFloats(x)])
    )
  }
  if (typeof v === "number" && !Number.isInteger(v) && v % 1 === 0) return Math.trunc(v)
  return v
}

// Key sorting helper for V2 canonicalisation
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === "object") {
    return Object.keys(v as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((v as Record<string, unknown>)[k])
        return acc;
      }, {})
  }
  return v
}

// Timing-safe constant-time string comparison helper
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// HMAC-SHA256 signature verification helper using Web Crypto API
async function verifySignature(secret: string, signature: string, canonicalBody: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify", "sign"]
    )
    const bodyData = encoder.encode(canonicalBody)
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, bodyData)
    
    // Convert calculated buffer to hex string
    const hashArray = Array.from(new Uint8Array(signatureBuffer))
    const expectedHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return timingSafeEqual(signature.toLowerCase(), expectedHex.toLowerCase())
  } catch (err) {
    console.error("Signature verification error:", err)
    return false
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const bodyText = await req.text()
    
    const webhookSecret = Deno.env.get("DIDIT_WEBHOOK_SECRET")
    const sig = req.headers.get("x-signature-v2") ?? ""
    const ts = Number(req.headers.get("x-timestamp"))

    // 1. Freshness Check (replay protection)
    if (webhookSecret) {
      if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) {
        console.error("Stale webhook request or missing timestamp")
        return new Response("stale", { status: 401, headers: corsHeaders })
      }

      // 2. Canonicalisation
      const parsed = JSON.parse(bodyText)
      const canonical = JSON.stringify(sortKeys(shortenFloats(parsed)))

      // 3. Signature verification
      if (sig) {
        const isValid = await verifySignature(webhookSecret, sig, canonical)
        if (!isValid) {
          console.error("Invalid Didit V2 webhook signature detected")
          return new Response("bad sig", { status: 401, headers: corsHeaders })
        }
      } else {
        console.error("Signature header x-signature-v2 is missing")
        return new Response("missing sig", { status: 401, headers: corsHeaders })
      }
    }

    const payload = JSON.parse(bodyText)
    console.log("🔔 Didit Webhook Payload:", JSON.stringify(payload))

    // Retrieve fields from payload
    const userId = payload.vendor_data
    const status = payload.status // Case-sensitive: 'Approved', 'Declined', 'In Review', etc.

    if (!userId) {
      console.error("Missing vendor_data in webhook payload")
      return new Response("missing vendor_data", { status: 400, headers: corsHeaders })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    const isApproved = status === "Approved"
    const finalStatus = status ? status.toLowerCase() : "unknown"

    console.log(`Processing Didit Webhook: user_id=${userId}, status=${status}, isApproved=${isApproved}`)

    // 4. Update the user record in public.users table
    const { error: dbError } = await supabaseClient
      .from("users")
      .update({
        id_verified: isApproved,
        verification_status: finalStatus,
        verification_date: new Date().toISOString(),
        verification_details: payload,
      })
      .eq("id", userId)

    if (dbError) {
      console.error("Database update error:", dbError)
      return new Response("db error", { status: 500, headers: corsHeaders })
    }

    return new Response("ok", { status: 200, headers: corsHeaders })
  } catch (error: any) {
    console.error("Webhook exception:", error)
    return new Response(error.message, { status: 500, headers: corsHeaders })
  }
})
