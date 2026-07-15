// @ts-nocheck — Deno edge function: type-checked by Deno LSP, not Node TS
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { userId, redirectUrl, action } = body

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    const diditApiKey = Deno.env.get("DIDIT_API_KEY")
    if (!diditApiKey) {
      console.error("DIDIT_API_KEY is not configured in Supabase Edge Function secrets")
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (action === "check-status") {
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      // 1. Fetch verification_id from profiles
      const { data: profile, error: profileErr } = await supabaseClient
        .from("profiles")
        .select("verification_id, verification_status")
        .eq("id", userId)
        .maybeSingle()

      if (profileErr) {
        console.error("Database query error:", profileErr)
        return new Response(JSON.stringify({ error: `Database check failed: ${profileErr.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      const sessionId = profile?.verification_id
      if (!sessionId) {
        return new Response(JSON.stringify({ status: "not_started", message: "No verification session found for this user." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      // 2. Poll Didit API decision endpoint
      console.log(`Polling Didit decision for session ${sessionId} / user ${userId}...`)
      const response = await fetch(`https://verification.didit.me/v3/session/${sessionId}/decision/`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "x-api-key": diditApiKey,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Didit Decision API error:", errorText)
        return new Response(
          JSON.stringify({ error: `Didit decision query failed: ${response.statusText} (${errorText})` }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      }

      const decisionData = await response.json()
      const status = decisionData.status // e.g. "Approved", "Declined", "In Review"
      console.log(`Didit decision result: status=${status}`, JSON.stringify(decisionData))

      const isApproved = status === "Approved"
      const finalStatus = status ? status.toLowerCase() : "unknown"

      // 3. Update database profiles & users
      const { error: profilesError } = await supabaseClient
        .from("profiles")
        .update({
          id_verified: isApproved,
          verification_status: finalStatus,
          verification_date: new Date().toISOString(),
        })
        .eq("id", userId)

      if (profilesError) {
        console.error("Profiles update error in manual status check:", profilesError)
      }

      const { error: usersError } = await supabaseClient
        .from("users")
        .update({
          id_verified: isApproved,
          verification_status: finalStatus,
          verification_date: new Date().toISOString(),
          verification_details: decisionData,
        })
        .eq("id", userId)

      if (usersError) {
        console.warn("Users table update error in manual status check (non-fatal):", usersError)
      }

      return new Response(JSON.stringify({ verified: isApproved, status: finalStatus }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Call Didit API to create verification session using the Free KYC workflow_id
    const response = await fetch("https://verification.didit.me/v3/session/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": diditApiKey,
      },
      body: JSON.stringify({
        workflow_id: "8857b669-bf52-4189-a61a-6da932ed20a0",
        vendor_data: userId,
        callback: redirectUrl || "https://www.ausaguide.com/onboarding?didit_done=true",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Didit API error:", errorText)
      return new Response(
        JSON.stringify({ error: `Didit session creation failed: ${response.statusText} (${errorText})` }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const data = await response.json()
    const { session_id, url } = data

    if (!session_id || !url) {
      return new Response(JSON.stringify({ error: "Invalid response from Didit" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Update user record with verification_id
    const { error: dbError } = await supabaseClient
      .from("profiles")
      .update({
        verification_id: session_id,
        verification_status: "started",
      })
      .eq("id", userId)

    if (dbError) {
      console.error("Database update error:", dbError)
      return new Response(JSON.stringify({ error: `Database update failed: ${dbError.message || JSON.stringify(dbError)}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("Unhandled error:", error)
    return new Response(JSON.stringify({ error: `Unhandled server error: ${error.message || String(error)}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
