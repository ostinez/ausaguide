// @ts-nocheck — Deno edge function: type-checked by Deno LSP, not Node TS
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

/**
 * export-user-data Supabase Edge Function
 * 
 * Secure Deno serverless endpoint to retrieve all user database tables in compliance with GDPR.
 * Validates request authorization header to extract user id, queries all user profile tables parallelly,
 * and compiles a structured JSON download response.
 * 
 * @param {Request} req - Incoming HTTP request with Authorization Bearer JWT token
 * @returns {Promise<Response>} JSON payload containing all accumulated user data
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      throw new Error("No Authorization header provided")
    }

    // Get the JWT token
    const token = authHeader.replace("Bearer ", "")

    // Initialize Supabase Client with service role key to query all user records
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing database connection secrets")
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate the user token to extract the user ID safely
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authorization token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const userId = user.id

    console.log(`[export-user-data] Initiated data export for user: ${userId}`)

    // Query all relevant tables parallelly
    const [
      profileRes,
      toursRes,
      bookingsRes,
      messagesRes,
      postsRes,
      journalsRes,
      commentsRes
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabaseAdmin.from("tours").select("*").eq("host_id", userId),
      supabaseAdmin.from("bookings").select("*").or(`guest_id.eq.${userId},host_id.eq.${userId}`),
      supabaseAdmin.from("messages").select("*").or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
      supabaseAdmin.from("posts").select("*").eq("user_id", userId),
      supabaseAdmin.from("journals").select("*").eq("user_id", userId),
      supabaseAdmin.from("comments").select("*").eq("author_id", userId),
    ])

    // Compile into a structured output
    const exportedData = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      email: user.email,
      profile: profileRes.data || null,
      tours: toursRes.data || [],
      bookings: bookingsRes.data || [],
      messages: messagesRes.data || [],
      posts: postsRes.data || [],
      journals: journalsRes.data || [],
      comments: commentsRes.data || [],
    }

    return new Response(JSON.stringify(exportedData), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="user-data-export.json"`
      },
    })
  } catch (error) {
    console.error(`[export-user-data] Server error:`, error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
