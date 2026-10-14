import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency, reference, customer, callback_url, metadata, booking_id } = await req.json()

    const bookingId = metadata?.booking_id || booking_id || reference

    const payzaResponse = await fetch('https://payzaapi.co.ke/api/v1/pay', {
      method: 'POST',
      headers: {
        'X-Public-Key': Deno.env.get('PAYZA_PUBLIC_KEY')!,
        'X-Secret-Key': Deno.env.get('PAYZA_SECRET_KEY')!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        reference,
        customer,
        callback_url,
        metadata: {
          ...(metadata || {}),
          booking_id: bookingId,
        },
      }),
    })

    const data = await payzaResponse.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: payzaResponse.status,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
