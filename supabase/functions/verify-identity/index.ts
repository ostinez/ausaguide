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
    const { userId, redirectUrl } = await req.json()

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const diditApiKey = Deno.env.get("DIDIT_API_KEY")
    if (!diditApiKey) {
      console.error("DIDIT_API_KEY is not configured in Supabase Edge Function secrets")
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
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
        callback: redirectUrl || "http://localhost:5173/onboarding?didit_done=true",
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

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

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
