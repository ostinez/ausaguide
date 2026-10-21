import { FileText, ShieldAlert, BadgeCheck, Scale, Video, Smartphone, Bot, Database, Lock } from "lucide-react"
import { Link } from "react-router-dom"
import { useSEO } from "@/hooks/useSEO"

export default function TermsPage() {
  useSEO({
    title: "Terms of Service | Ausaguide",
    description: "Ausaguide Terms of Service: Platform agreements, M-Pesa payments, Supabase storage, AI itineraries, Live Video streaming, and Kenya Data Protection Act compliance.",
  })

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <FileText className="size-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl font-headline">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Effective Date: October 2026 • Governing Law: Republic of Kenya
          </p>
        </div>

        {/* Content Card */}
        <div className="rounded-3xl border border-border bg-card/90 backdrop-blur-md p-6 md:p-10 shadow-2xl space-y-8 text-muted-foreground leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BadgeCheck className="size-5 text-primary" />
              1. Agreement to Terms
            </h2>
            <p>
              Welcome to Ausaguide ("Ausaguide", "Platform", "we", "us", or "our"), operated in Nairobi, Kenya. By accessing or using our web application, mobile interfaces, APIs, or interactive services, you ("User", "Traveler", or "Host") agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to these Terms, you must immediately discontinue use of the Platform.
            </p>
            <p>
              These Terms constitute a legally binding agreement under the laws of the Republic of Kenya, including the <em>Kenya Information and Communications Act</em>, the <em>Consumer Protection Act</em>, and the <em>Data Protection Act, 2019</em>.
            </p>
          </section>

          {/* Section 2: Platform Architecture & Technology Stack */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Database className="size-5 text-primary" />
              2. Technology Stack & Operational Architecture
            </h2>
            <p>
              Ausaguide operates as a digital intermediary platform connecting independent local tour hosts and certified guides in Kenya with domestic and international travelers. Our services are powered by specialized infrastructure:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4 text-sm">
              <li>
                <strong>Cloud Database & Storage (Supabase):</strong> User accounts, profile verification records, and license documentation are hosted on enterprise-grade PostgreSQL infrastructure managed by Supabase with Row Level Security (RLS) and encrypted AWS/S3-compatible object storage.
              </li>
              <li>
                <strong>Payment Processing (M-Pesa & Cards via IntaSend):</strong> Financial transactions, including Safaricom M-Pesa STK Push prompts and international debit/credit cards, are processed securely through licensed payment gateway partners complying with PCI-DSS Level 1 standards.
              </li>
              <li>
                <strong>Live Video Streaming (WebRTC / Daily.co):</strong> Virtual interactive tours and preview streams utilize real-time WebRTC low-latency media infrastructure provided by Daily.co.
              </li>
              <li>
                <strong>AI Travel Planning:</strong> Itinerary recommendations and travel curation utilize generative artificial intelligence systems to synthesize personalized recommendations.
              </li>
            </ul>
          </section>

          {/* Section 3: Payments & M-Pesa STK Push */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Smartphone className="size-5 text-primary" />
              3. Bookings, Payments & M-Pesa Transactions
            </h2>
            <p>
              All tour bookings made on Ausaguide are facilitated electronically. By initiating a booking, you authorize our payment processor (IntaSend) to charge the designated payment method:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-4 text-sm">
              <li>
                <strong>M-Pesa Checkout:</strong> When paying via Safaricom M-Pesa, an automated STK Push is dispatched to the Kenyan phone number provided at checkout. You are responsible for verifying transaction amounts before entering your secret PIN. Ausaguide never requests, accesses, or stores your M-Pesa PIN.
              </li>
              <li>
                <strong>Pricing & Currency:</strong> Tour prices are displayed in Kenyan Shillings (KES) or equivalent international currencies (USD/EUR) including all applicable regulatory levies and platform service commissions.
              </li>
              <li>
                <strong>Escrow-Style Host Payouts:</strong> Booking funds are held safely until the booked tour or video experience commences, protecting travelers against fraudulent hosts and ensuring host payment upon fulfillment.
              </li>
              <li>
                <strong>Cancellations & Refunds:</strong> Full refunds are provided for traveler cancellations submitted at least 48 hours prior to scheduled departure. Cancellations within 48 hours are non-refundable unless resulting from host default, extreme weather, or documented force majeure.
              </li>
            </ul>
          </section>

          {/* Section 4: Live Video Sessions & Code of Conduct */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Video className="size-5 text-primary" />
              4. Live Video Experiences & Stream Etiquette
            </h2>
            <p>
              Ausaguide enables live, interactive video streaming allowing travelers to preview destinations and explore Kenya in real time with local hosts:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-4 text-sm">
              <li>
                <strong>Live Conduct:</strong> All video session participants must adhere strictly to community safety standards. Harassment, hate speech, explicit sexual conduct, unauthorized filming of private individuals, or dangerous stunts are grounds for immediate stream termination and permanent ban.
              </li>
              <li>
                <strong>Recording Prohibitions:</strong> Users may not record, capture, republish, or commercialize live stream footage without explicit prior written authorization from both the host and Ausaguide.
              </li>
              <li>
                <strong>Connectivity Disclaimer:</strong> Because live tours occur outdoors across various locations in Kenya, streams depend on local cellular bandwidth (Safaricom / Airtel 4G/5G). Ausaguide is not liable for temporary carrier connectivity dropouts, though alternative scheduling will be provided.
              </li>
            </ul>
          </section>

          {/* Section 5: AI Itineraries & Automated Recommendations */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Bot className="size-5 text-primary" />
              5. AI Travel Itineraries & Recommendation Disclaimer
            </h2>
            <p>
              Our platform incorporates artificial intelligence models to provide automated itinerary suggestions, travel tips, and cultural guides:
            </p>
            <p className="text-sm">
              <strong>Planning Disclaimers:</strong> AI-generated itineraries are provided exclusively for informational, planning, and inspirational purposes. Real-world conditions—such as park fee adjustments by the Kenya Wildlife Service (KWS), road construction, seasonal wildlife migrations, and national park operating hours—must be verified independently by travelers with certified guides. Ausaguide disclaims liability for inaccuracies generated by autonomous AI algorithms.
            </p>
          </section>

          {/* Section 6: Host Credentials & Verification */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="size-5 text-primary" />
              6. Host Responsibilities & Regulatory Certification
            </h2>
            <p>
              Hosts are independent contractors and not employees, agents, or joint venturers of Ausaguide:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-4 text-sm">
              <li>
                <strong>Tourism Regulatory Authority (TRA) Compliance:</strong> Hosts advertising as "Certified Guides" must submit authentic licensing from the Tourism Regulatory Authority (TRA) and/or Kenya Professional Safari Guides Association (KPSGA). Ausaguide audits license numbers and expiry dates but relies on government databases.
              </li>
              <li>
                <strong>Local Hosts:</strong> Uncertified hosts operate as cultural guides and local companions and may not operate safaris or commercial transport requiring statutory commercial licensing.
              </li>
              <li>
                <strong>Safety & Insurance:</strong> Hosts must exercise professional duty of care, uphold traveler safety, and ensure personal liability coverage where legally required.
              </li>
            </ul>
          </section>

          {/* Section 7: Kenya Data Protection Act Compliance */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Lock className="size-5 text-primary" />
              7. Data Privacy & Kenya Data Protection Act, 2019
            </h2>
            <p>
              Ausaguide complies strictly with the <em>Data Protection Act, 2019</em> of Kenya and regulations established by the Office of the Data Protection Commissioner (ODPC).
            </p>
            <p className="text-sm">
              We collect, store, and process personal data—including names, contact numbers for M-Pesa billing, uploaded certification documents, and geolocation—solely for legitimate contractual purposes. For complete details on your statutory rights to access, rectify, or erase your data, review our <Link to="/privacy" className="text-primary hover:underline font-semibold">Privacy Policy</Link>.
            </p>
          </section>

          {/* Section 8: Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Scale className="size-5 text-primary" />
              8. Limitation of Liability & Dispute Resolution
            </h2>
            <p className="text-sm">
              To the maximum extent permitted by Kenyan law, Ausaguide, its directors, employees, and technology partners shall not be liable for any indirect, incidental, punitive, or consequential damages arising from: (a) physical travel activities undertaken during tours; (b) host misconduct; (c) interruptions to live video streams or cellular networks; or (d) unauthorized access to Supabase database clusters beyond reasonable commercial cybersecurity standards.
            </p>
            <p className="text-sm">
              <strong>Governing Law:</strong> These Terms shall be governed by and construed in accordance with the substantive laws of the Republic of Kenya. Any dispute that cannot be resolved amicably within 30 days shall be submitted to the exclusive jurisdiction of the competent courts of Nairobi, Kenya.
            </p>
          </section>

          {/* Contact Section */}
          <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© 2026 Ausaguide Ltd. All rights reserved. Nairobi, Kenya.</p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              <span>•</span>
              <a href="mailto:welcome@ausaguide.com" className="text-primary hover:underline">Legal Contact</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
