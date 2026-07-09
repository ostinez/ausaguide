// @ts-nocheck -- Deno edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno"

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
    const { type, itemName, amount, userId } = await req.json()

    if (!type || !itemName || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields: type, itemName, amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || ""
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not set in environment")
      return new Response(JSON.stringify({ error: "Stripe configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase environment variables not set")
      return new Response(JSON.stringify({ error: "Database configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Origin header for absolute success and cancel redirection URLs
    const origin = req.headers.get("origin") || "http://localhost:5173"

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: itemName,
              description: type === 'tree-planting' ? 'Eco Tree Planting Donation' : 'Mental Health Support Sponsorship',
            },
            unit_amount: amount, // unit_amount is in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/thank-you?type=${type}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${type === 'tree-planting' ? 'tree-planting' : 'mental-health'}`,
      metadata: {
        type,
        item_name: itemName,
        amount: amount.toString(),
        user_id: userId || '',
      },
    })

    // Insert pending donation row in Supabase donations table
    const { data: donation, error: insertErr } = await supabase
      .from("donations")
      .insert({
        user_id: userId || null,
        type,
        item_name: itemName,
        amount,
        status: 'pending',
        stripe_session_id: session.id,
      })
      .select()
      .single()

    if (insertErr) {
      console.error("Failed to insert pending donation row:", insertErr)
      return new Response(JSON.stringify({ error: `Database insertion error: ${insertErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    console.log(`Created Stripe Checkout Session ${session.id} for donation ID ${donation.id}`)

    return new Response(JSON.stringify({ sessionId: session.id, sessionUrl: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err: any) {
    console.error(`Unhandled edge function error: ${err.message}`)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
