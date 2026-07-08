import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables in Edge Function")
      return new Response(JSON.stringify({ error: "Configuration Error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current count of travel commitments
    const { count, error } = await supabase
      .from("travel_commitments")
      .select("*", { count: "exact", head: true })

    if (error) {
      console.error("Database query error:", error)
      return new Response(JSON.stringify({ error: "Database query failed: " + error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Format the sequential ID, e.g. AUS-TRAVEL-0001
    const nextIndex = (count || 0) + 1
    const commitmentId = `AUS-TRAVEL-${nextIndex.toString().padStart(4, "0")}`

    return new Response(JSON.stringify({ commitment_id: commitmentId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: any) {
    console.error("Unhandled error:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
