import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Note: crypto.subtle is available as a Deno built-in global — no import needed

serve(async (req) => {
  try {
    const signature = req.headers.get('X-Payza-Signature') || ''
    const rawBody = await req.text()
    
    const secret = Deno.env.get('PAYZA_WEBHOOK_SECRET')!
    
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature')
      return new Response('Unauthorized', { status: 401 })
    }

    const event = JSON.parse(rawBody)
    console.log('Webhook received:', event)

    if (event.event === 'payment.success') {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const { error } = await supabaseClient
        .from('bookings')
        .update({ 
            payment_status: 'paid', 
            payment_reference: event.reference,
            paid_at: new Date().toISOString()
        })
        .eq('payment_reference', event.reference)

      if (error) {
        console.error('Error updating booking:', error)
        return new Response('Database update failed', { status: 500 })
      }

      console.log(`Booking ${event.reference} marked as paid.`)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
})
