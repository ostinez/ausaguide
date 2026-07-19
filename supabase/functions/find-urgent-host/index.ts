// @ts-nocheck -- Deno edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // 1. Parse authorization header to get user token
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { latitude, longitude, budget, experienceType } = await req.json()
    if (latitude === undefined || longitude === undefined || !budget || !experienceType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: latitude, longitude, budget, experienceType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase credentials not configured in environment")
      return new Response(JSON.stringify({ error: "Server database configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Initialize user Supabase client to verify authorization token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid user session or token expired" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const travelerId = user.id

    // Initialize service role client for privileged database operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Proximity search for available hosts (within 5km = 5000 meters)
    const experienceTypeArray = Array.isArray(experienceType) ? experienceType : [experienceType]
    const { data: matchedHosts, error: rpcError } = await serviceClient.rpc("find_urgent_hosts", {
      lat: Number(latitude),
      lng: Number(longitude),
      max_distance_meters: 5000.0,
      max_budget: Number(budget),
      req_experience_types: experienceTypeArray,
    })

    if (rpcError) {
      console.error("RPC find_urgent_hosts failed:", rpcError.message)
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // 3. Create the urgent request entry
    const pointString = `SRID=4326;POINT(${longitude} ${latitude})`
    const { data: urgentRequest, error: insertError } = await serviceClient
      .from("urgent_requests")
      .insert({
        traveler_id: travelerId,
        location: pointString,
        budget: Number(budget),
        experience_type: experienceTypeArray,
        status: "pending",
      })
      .select("*")
      .single()

    if (insertError) {
      console.error("Insert urgent_requests failed:", insertError.message)
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // 4. Send Notifications (email via Brevo and in-app notifications)
    const hostEmails: string[] = []
    
    for (const host of matchedHosts || []) {
      if (host.email) {
        hostEmails.push(host.email)
      }

      // Add in-app notification
      await serviceClient.from("notifications").insert({
        user_id: host.id,
        message: `🚨 URGENT traveler match request near you! Experience: ${experienceTypeArray.join(", ")}, Budget: ${budget} KES/hr. Accept within 15 minutes.`,
        type: "booking_request",
      })

      // Increment stats for received urgent requests
      const currentReceived = host.urgent_requests_received || 0
      await serviceClient
        .from("profiles")
        .update({ urgent_requests_received: currentReceived + 1 })
        .eq("id", host.id)
    }

    // Send emails using Brevo if API key is present
    const brevoKey = Deno.env.get("BREVO_API_KEY")
    if (brevoKey && hostEmails.length > 0) {
      try {
        const sendPromises = hostEmails.map((email) =>
          fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
              "api-key": brevoKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sender: { name: "Ausaguide Matcher", email: "welcome@ausaguide.com" },
              to: [{ email }],
              subject: "🚨 Urgent Traveler Request Near You!",
              htmlContent: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                  <h2>🚨 Urgent Traveler Request Near You!</h2>
                  <p>A traveler has requested an urgent local guide near your current location.</p>
                  <p><strong>Required Experience:</strong> ${experienceTypeArray.join(", ")}</p>
                  <p><strong>Budget Offered:</strong> ${budget} KES / hour</p>
                  <p>You have <strong>15 minutes</strong> to accept this request in your host dashboard before it expires.</p>
                  <br/>
                  <a href="https://ausaguide.com/dashboard" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Host Dashboard</a>
                </div>
              `,
            }),
          })
        )
        await Promise.all(sendPromises)
      } catch (err) {
        console.error("Error dispatching Brevo emails:", err)
      }
    } else {
      console.log(`[Sandbox Mode] Matched hosts: ${hostEmails.join(", ")}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        request: urgentRequest,
        hostsFound: matchedHosts?.length ?? 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error: any) {
    console.error("Global edge function exception:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
