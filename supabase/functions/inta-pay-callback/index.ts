// deno-lint-ignore-file
// inta-pay-callback: Webhook handler for IntaSend M-PESA & Card payments
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-intasend-challenge",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const challengeSecret = Deno.env.get("INTASEND_WEBHOOK_CHALLENGE") || "ausaguide_webhook_secret_2026";
    const headerChallenge = req.headers.get("x-intasend-challenge") || req.headers.get("X-Intasend-Challenge");

    const payload = await req.json().catch(() => ({}));
    console.log("📩 IntaSend callback received:", JSON.stringify(payload, null, 2));

    // Optional challenge check if header is present
    if (headerChallenge && challengeSecret && headerChallenge !== challengeSecret) {
      console.warn("⚠️ Webhook challenge mismatch! Incoming:", headerChallenge);
    }

    // Extract event, state, order_id / api_ref, and payment ID
    const event = payload.event || payload.challenge || "";
    const state = (payload.state || payload.invoice?.state || payload.data?.state || "").toUpperCase();
    const invoiceId = payload.invoice?.invoice_id || payload.invoice_id || payload.data?.transaction_id || payload.data?.id || "";
    const apiRef = payload.invoice?.api_ref || payload.api_ref || payload.data?.order_id || payload.order_id || "";
    const amount = payload.invoice?.net_amount || payload.invoice?.amount || payload.amount || payload.data?.amount || 0;

    console.log(`📦 Event: ${event}, State: ${state}, Invoice/Txn: ${invoiceId}, Ref: ${apiRef}`);

    // If event is collection or state is COMPLETE/SUCCESS
    const isSuccess =
      event === "collection" ||
      ["COMPLETE", "COMPLETED", "SUCCESS", "SUCCESSFUL", "PAID"].includes(state);

    if (!isSuccess) {
      console.log(`⏩ Ignoring non-successful webhook state: ${state} / event: ${event}`);
      return new Response(
        JSON.stringify({ received: true, action: "ignored", state, event }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the booking by api_ref (bookingId) or payment_id (invoiceId)
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
        JSON.stringify({ received: true, error: "Booking record not found", ref: apiRef }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Confirming booking ${booking.id}...`);

    // Update booking status to confirmed & payment_status to paid
    await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        payment_id: invoiceId || booking.payment_id,
        payment_amount: amount || booking.total_price,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    // Find or create conversation between traveler and host
    const travelerId = booking.guest_id || booking.traveler_id;
    const hostId = booking.host_id;

    if (travelerId && hostId) {
      let convId: string | null = null;
      const [pA, pB] = [travelerId, hostId].sort();

      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant_a.eq.${pA},participant_b.eq.${pB}),and(participant_a.eq.${pB},participant_b.eq.${pA})`
        )
        .maybeSingle();

      if (existingConv) {
        convId = existingConv.id;
      } else {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({
            participant_a: pA,
            participant_b: pB,
          })
          .select("id")
          .single();
        convId = newConv?.id ?? null;
      }

      if (convId) {
        // Check if receipt message already exists
        const { data: existingReceipt } = await supabase
          .from("messages")
          .select("id")
          .eq("conversation_id", convId)
          .eq("sender_type", "system")
          .like("message", `%${booking.id}%`)
          .maybeSingle();

        if (!existingReceipt) {
          const receiptMeta = {
            type: "booking_receipt",
            booking_id: booking.id,
            tour_name: booking.tours?.title || "Tour",
            date: booking.booking_date,
            time: booking.booking_time,
            guests: booking.guest_count,
            total: amount || booking.total_price,
            currency: booking.tours?.currency || booking.currency || "KES",
            payment_id: invoiceId,
            confirmed_at: new Date().toISOString(),
          };

          const { error: msgErr } = await supabase.from("messages").insert({
            conversation_id: convId,
            sender_id: travelerId,
            receiver_id: travelerId,
            message: `✅ Booking confirmed for ${receiptMeta.tour_name} on ${receiptMeta.date}`,
            sender_type: "system",
            metadata: receiptMeta,
            read: false,
          });

          if (msgErr) {
            console.error("❌ Error inserting receipt message:", msgErr);
          } else {
            console.log(`💬 Receipt inserted into conversation ${convId}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true, action: "confirmed", booking_id: booking.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("🔥 inta-pay-callback error:", error);
    return new Response(
      JSON.stringify({ received: true, error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
