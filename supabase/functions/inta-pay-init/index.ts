// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

function getIntaSendApiKey(): string {
  return (
    Deno.env.get("INTASEND_API_KEY") ||
    Deno.env.get("INTASEND_SECRET_KEY") ||
    Deno.env.get("intasend api secret key") ||
    ""
  );
}

function getIntaSendPublicKey(): string {
  return (
    Deno.env.get("INTASEND_PUBLIC_KEY") ||
    Deno.env.get("INTASEND_PUBLISHABLE_KEY") ||
    Deno.env.get("intasend publishable key") ||
    ""
  );
}

function formatPhone(raw: string): string {
  let cleaned = (raw || "").replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "254" + cleaned.slice(1);
  else if (cleaned.startsWith("7") || cleaned.startsWith("1")) cleaned = "254" + cleaned;
  else if (!cleaned.startsWith("254")) cleaned = "254" + cleaned;
  return cleaned;
}

serve(async (req) => {
  // --- CORS headers (required for browser calls) ---
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const apiKey = getIntaSendApiKey();
    const publicKey = getIntaSendPublicKey();
    const isProduction = Deno.env.get("INTASEND_IS_PRODUCTION") === "true";
    const baseUrl = isProduction
      ? "https://payment.intasend.com/api/v1"
      : "https://sandbox.intasend.com/api/v1";

    // 1. Parse and validate input (support both camelCase and snake_case)
    const body = await req.json();
    const amount = body.amount;
    const email = body.email || body.guest_email || body.customer_email;
    const bookingId = body.bookingId || body.booking_id;
    const phone = body.phone || body.guest_phone || body.phone_number;
    const currency = body.currency || "KES";
    const method = body.method || (phone ? "STK_PUSH" : "CARD");

    if (!amount || !email || !bookingId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, email, bookingId (or booking_id)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validate IntaSend API key
    if (!apiKey) {
      console.error("IntaSend API Key is missing in Edge Function environment variables");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured: missing INTASEND_API_KEY in secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const finalAmount = Math.max(10, Math.round(Number(amount) || 10));

    let paymentId = "";
    let checkoutUrl = "";
    let status = "pending";
    let responseData: any = {};

    if (method === "STK_PUSH") {
      if (!phone) {
        return new Response(
          JSON.stringify({ error: "Missing phone number for M-PESA STK Push" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const formattedPhone = formatPhone(phone);
      if (!formattedPhone.startsWith("254") || formattedPhone.length !== 12) {
        return new Response(
          JSON.stringify({ error: `Invalid phone number format: ${phone}. Must be 254XXXXXXXXX.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payload: Record<string, any> = {
        amount: finalAmount,
        phone_number: formattedPhone,
        email: email,
        api_ref: bookingId,
        currency: currency,
      };

      if (publicKey) {
        payload.public_key = publicKey;
      }

      console.log("📤 Sending STK Push to IntaSend:", JSON.stringify(payload, null, 2));

      const response = await fetch(`${baseUrl}/payment/mpesa-stk-push/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`📥 IntaSend raw response (${response.status}):`, responseText);

      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      if (!response.ok) {
        console.error("❌ IntaSend STK Push error:", responseData);
        return new Response(
          JSON.stringify({
            error: "IntaSend STK Push failed",
            details: responseData.detail || responseData.message || responseData,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      paymentId = responseData.invoice?.invoice_id || responseData.tracking_id || responseData.id || `IS_${bookingId}`;
      status = responseData.invoice?.state || responseData.status || "PROCESSING";

    } else {
      const payload: Record<string, any> = {
        amount: finalAmount,
        currency: currency,
        email: email,
        api_ref: bookingId,
        redirect_url: `${req.headers.get("origin") || "http://localhost:5173"}/payment-success?booking_id=${bookingId}`,
      };

      if (phone) {
        payload.phone_number = formatPhone(phone);
      }
      if (publicKey) {
        payload.public_key = publicKey;
      }

      console.log("📤 Sending Hosted Checkout to IntaSend:", JSON.stringify(payload, null, 2));

      const response = await fetch(`${baseUrl}/checkout/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`📥 IntaSend Hosted Checkout raw response (${response.status}):`, responseText);

      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      if (!response.ok) {
        console.error("❌ IntaSend Checkout error:", responseData);
        return new Response(
          JSON.stringify({
            error: "IntaSend Checkout failed",
            details: responseData.detail || responseData.message || responseData,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      paymentId = responseData.id || responseData.signature || `IS_${bookingId}`;
      checkoutUrl = responseData.url || "";
      status = responseData.status || "PENDING";
    }

    // 5. Update booking in Supabase if URL is present
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseServiceKey && bookingId && !bookingId.startsWith("test-")) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from("bookings")
          .update({
            payment_id: paymentId,
            payment_amount: finalAmount,
            payment_currency: currency,
            payment_status: "pending",
          })
          .eq("id", bookingId);
      } catch (dbErr) {
        console.error("⚠️ Database update non-fatal error:", dbErr);
      }
    }

    // 6. Return Clean Success JSON
    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentId,
        checkout_url: checkoutUrl,
        status: status,
        data: responseData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("🔥 Unhandled exception in inta-pay-init:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message || String(error),
        stack: error.stack,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
