// deno-lint-ignore-file
// inta-pay-callback: Receives webhook from IntaSend after M-PESA payment completes
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log("📩 IntaSend callback received:", JSON.stringify(payload, null, 2));

    // IntaSend sends: { state, invoice: { invoice_id, api_ref, ... }, ... }
    const state = (payload.state || payload.invoice?.state || "").toUpperCase();
    const invoiceId = payload.invoice?.invoice_id || payload.invoice_id || "";
    const apiRef = payload.invoice?.api_ref || payload.api_ref || "";
    const amount = payload.invoice?.net_amount || payload.invoice?.amount || payload.amount || 0;

    console.log(`📦 State: ${state}, Invoice: ${invoiceId}, Ref: ${apiRef}`);

    if (!["COMPLETE", "COMPLETED", "SUCCESS", "SUCCESSFUL"].includes(state)) {
      console.log(`⏩ Ignoring non-success state: ${state}`);
      return new Response(
        JSON.stringify({ received: true, action: "ignored", state }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the booking by api_ref (bookingId) or by payment_id (invoiceId)
    let booking: any = null;
    if (apiRef) {
      const { data } = await supabase
        .from("bookings")
        .select("*, tours(title, currency)")
        .eq("id", apiRef)
        .maybeSingle();
      booking = data;
    }
    if (!booking && invoiceId) {
      const { data } = await supabase
        .from("bookings")
        .select("*, tours(title, currency)")
        .eq("payment_id", invoiceId)
        .maybeSingle();
      booking = data;
    }

    if (!booking) {
      console.error(`❌ No booking found for apiRef=${apiRef} or invoiceId=${invoiceId}`);
      return new Response(
        JSON.stringify({ received: true, error: "Booking not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Found booking ${booking.id}, confirming...`);

    // Update booking status to confirmed
    await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        payment_id: invoiceId || booking.payment_id,
        payment_amount: amount || booking.payment_amount,
      })
      .eq("id", booking.id);

    // Find or create conversation between traveler and host
    const travelerId = booking.guest_id;
    const hostId = booking.host_id;

    if (travelerId && hostId) {
      let convId: string | null = null;

      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant1_id.eq.${travelerId},participant2_id.eq.${hostId}),and(participant1_id.eq.${hostId},participant2_id.eq.${travelerId})`
        )
        .maybeSingle();

      if (existingConv) {
        convId = existingConv.id;
      } else {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({
            participant1_id: travelerId,
            participant2_id: hostId,
            last_message: "🧾 Booking confirmed",
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        convId = newConv?.id ?? null;
      }

      if (convId) {
        // Insert booking receipt as system message
        const receiptMeta = {
          type: "booking_receipt",
          booking_id: booking.id,
          tour_name: booking.tours?.title || "Tour",
          date: booking.booking_date,
          time: booking.booking_time,
          guests: booking.guest_count,
          total: amount || booking.total_price,
          currency: booking.tours?.currency || booking.payment_currency || "KES",
          payment_id: invoiceId,
          confirmed_at: new Date().toISOString(),
        };

        await supabase.from("messages").insert({
          conversation_id: convId,
          sender_id: null,
          receiver_id: travelerId,
          message: `✅ Booking confirmed for ${receiptMeta.tour_name} on ${receiptMeta.date}`,
          sender_type: "system",
          metadata: receiptMeta,
          read: false,
        });

        // Update conversation last message
        await supabase
          .from("conversations")
          .update({
            last_message: "🧾 Booking confirmed",
            last_message_at: new Date().toISOString(),
          })
          .eq("id", convId);

        console.log(`💬 Receipt inserted into conversation ${convId}`);
      }
    }

    return new Response(
      JSON.stringify({ received: true, action: "confirmed", booking_id: booking.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("🔥 inta-pay-callback error:", error);
    // Always return 200 to IntaSend so it doesn't retry endlessly
    return new Response(
      JSON.stringify({ received: true, error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
