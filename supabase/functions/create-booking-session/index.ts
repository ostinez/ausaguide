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
    const { bookingId, tourType } = await req.json()

    if (!bookingId || !tourType) {
      return new Response(JSON.stringify({ error: "Missing required fields: bookingId, tourType" }), {
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

    // Fetch booking details
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("*, tour:tours(*), host_profile:profiles!bookings_host_id_fkey(*)")
      .eq("id", bookingId)
      .single()

    if (bookingErr || !booking) {
      console.error("Failed to fetch booking details:", bookingErr)
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Origin header for absolute success and cancel redirection URLs
    const origin = req.headers.get("origin") || "http://localhost:5173"

    // Prepare payment intent data (manual capture)
    const paymentIntentData: any = {
      capture_method: "manual",
      metadata: {
        booking_id: bookingId,
        tour_type: tourType,
      },
    }

    // Connect destination configuration if host has connected their stripe account
    const hostStripeAccountId = booking.host_profile?.stripe_account_id
    if (hostStripeAccountId) {
      paymentIntentData.transfer_data = {
        destination: hostStripeAccountId,
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'kes',
            product_data: {
              name: booking.tour?.title || "Tour Booking",
              description: `${tourType === 'virtual' ? 'Virtual Live Tour' : 'Physical In-Person Experience'} - Booking Ref BK-${bookingId.slice(0, 8).toUpperCase()}`,
            },
            unit_amount: Math.round(Number(booking.total_price) * 100), // in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: paymentIntentData,
      success_url: `${origin}/confirmation/${bookingId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/${booking.tour_id}?error=payment_cancelled&date=${booking.booking_date}&time=${booking.booking_time}&guests=${booking.guest_count}`,
      metadata: {
        booking_id: bookingId,
        tour_type: tourType,
      },
    })

    // Update booking_type on bookings table
    const { error: updateErr } = await supabase
      .from("bookings")
      .update({ booking_type: tourType })
      .eq("id", bookingId)

    if (updateErr) {
      console.error("Failed to update booking type:", updateErr)
    }

    console.log(`Created Stripe Checkout Session ${session.id} for booking ID ${bookingId}`)

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
