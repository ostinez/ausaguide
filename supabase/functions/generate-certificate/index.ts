import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { name, tree_id, tree_name, dedication, date } = await req.json()

    if (!name || !tree_id) {
      return new Response(JSON.stringify({ error: "name and tree_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const formattedDate = date || new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Premium HTML Certificate Template
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ausaguide Tree Commitment Certificate</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Outfit:wght@700;900&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      background-color: #16161A;
      color: #FFFFFE;
      font-family: 'Inter', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .certificate-container {
      position: relative;
      width: 100%;
      max-width: 800px;
      background: radial-gradient(circle at top left, #1c1c22, #121214);
      border: 2px solid rgba(44, 182, 125, 0.3);
      border-radius: 24px;
      padding: 60px 40px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }

    .certificate-container::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 24px;
      padding: 2px;
      background: linear-gradient(135deg, #2CB67D, #7F5AF0);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    .glow-overlay {
      position: absolute;
      top: -150px;
      left: 50%;
      transform: translateX(-50%);
      width: 400px;
      height: 300px;
      background: radial-gradient(circle, rgba(44, 182, 125, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    .badge-icon {
      font-size: 64px;
      margin-bottom: 24px;
      filter: drop-shadow(0 0 15px rgba(44, 182, 125, 0.4));
    }

    h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 32px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: linear-gradient(to right, #2CB67D, #7F5AF0, #FFFFFE);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 30px;
    }

    .sub-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: rgba(255, 255, 254, 0.5);
      margin-bottom: 12px;
      font-weight: 600;
    }

    .recipient-name {
      font-family: 'Outfit', sans-serif;
      font-size: 40px;
      font-weight: 700;
      color: #FFFFFE;
      margin: 15px 0;
      text-shadow: 0 0 20px rgba(127, 90, 240, 0.3);
    }

    .description {
      font-size: 16px;
      line-height: 1.6;
      color: rgba(255, 255, 254, 0.7);
      max-width: 600px;
      margin: 0 auto 30px auto;
    }

    .details-grid {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 20px;
      max-width: 550px;
      margin: 40px auto 20px auto;
      border-top: 1px solid rgba(255, 255, 254, 0.1);
      padding-top: 30px;
    }

    .detail-item {
      text-align: left;
    }

    .detail-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: rgba(255, 255, 254, 0.4);
      margin-bottom: 4px;
    }

    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #FFFFFE;
    }

    .tree-id-value {
      color: #2CB67D;
      font-family: monospace;
      font-size: 16px;
      font-weight: 700;
    }

    .footer-note {
      font-size: 11px;
      color: rgba(255, 255, 254, 0.3);
      margin-top: 40px;
    }

    /* Print styling rules */
    @media print {
      body {
        background-color: #ffffff;
        color: #000000;
      }
      .certificate-container {
        border: 2px solid #000000;
        background: #ffffff;
        color: #000000;
        box-shadow: none;
        page-break-inside: avoid;
        margin: 0;
        padding: 40px;
        max-width: 100%;
        width: 100%;
        height: auto;
      }
      .certificate-container::before {
        background: #000000;
      }
      h1 {
        background: none;
        -webkit-text-fill-color: #000000;
        color: #000000;
      }
      .recipient-name {
        color: #000000;
        text-shadow: none;
      }
      .description, .sub-title, .detail-label, .detail-value, .footer-note {
        color: #000000;
      }
      .tree-id-value {
        color: #000000;
      }
      .details-grid {
        border-top: 1px solid #000000;
      }
      .print-btn, .back-btn {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="glow-overlay"></div>
    <div class="badge-icon">🌱</div>
    <div class="sub-title">Certificate of Commitment</div>
    <h1>Ausaguide Tree Initiative</h1>
    <p class="description">This certifies that</p>
    <div class="recipient-name">${name}</div>
    <p class="description">
      has committed to planting and caring for a virtual tree, contributing to the forest canopy restoration and ecological sustainability efforts in Kenya.
    </p>
    
    <div class="details-grid">
      <div class="detail-item">
        <div class="detail-label">Unique Tree ID</div>
        <div class="detail-value tree-id-value">${tree_id}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Commitment Date</div>
        <div class="detail-value">${formattedDate}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Tree Name</div>
        <div class="detail-value">${tree_name || "Unnamed"}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Dedication</div>
        <div class="detail-value">${dedication || "For the future of Kenya"}</div>
      </div>
    </div>

    <div class="footer-note">
      Ausaguide Conservation & Wellness Network • welcome@ausaguide.com
    </div>
  </div>
</body>
</html>
    `

    return new Response(JSON.stringify({ html: htmlContent }), {
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
