import { Shield, Eye, Database, Lock, Smartphone, Video, Bot, HelpCircle, CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useSEO } from "@/hooks/useSEO"

export default function PrivacyPage() {
  useSEO({
    title: "Privacy Policy | Ausaguide",
    description: "Ausaguide Privacy Policy: Kenya Data Protection Act 2019 compliance, M-Pesa billing privacy, Supabase database encryption, AI itineraries, and Live Video streaming data practices.",
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
            <Shield className="size-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl font-headline">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last Updated: October 2026 • Compliant with Kenya Data Protection Act, 2019
          </p>
        </div>

        {/* Content Card */}
        <div className="rounded-3xl border border-border bg-card/90 backdrop-blur-md p-6 md:p-10 shadow-2xl space-y-8 text-muted-foreground leading-relaxed">

          {/* Section 1: Data Controller & Kenyan Legal Authority */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Eye className="size-5 text-primary" />
              1. Data Controller Information & Kenyan Law
            </h2>
            <p>
              Ausaguide Ltd ("Ausaguide", "we", "us", or "our") acts as the Data Controller in respect of personal data collected through our travel platform, web applications, and related services.
            </p>
            <p className="text-sm">
              We process personal information in strict adherence to the <strong>Kenya Data Protection Act, 2019 (KDPA)</strong> and guidelines established by the <strong>Office of the Data Protection Commissioner (ODPC)</strong> of Kenya. If you have any inquiries regarding data protection or wish to communicate with our appointed Data Protection Officer (DPO), please email <a href="mailto:privacy@ausaguide.com" className="text-primary hover:underline font-semibold">privacy@ausaguide.com</a>.
            </p>
          </section>

          {/* Section 2: Categories of Data Collected */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Database className="size-5 text-primary" />
              2. Information We Collect
            </h2>
            <p>
              We collect information provided directly by you, generated automatically through your device, or processed during tour interactions:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4 text-sm">
              <li>
                <strong>Identity & Account Data:</strong> Full name, verified email address, chosen username, password hashes, profile avatar, language preferences, and bio.
              </li>
              <li>
                <strong>Payment & Billing Data (M-Pesa):</strong> Mobile telephone number formatted for Safaricom M-Pesa STK push prompts, transaction reference IDs, and payment statuses. <em>We never receive or store your M-Pesa PIN or credit card CVV.</em>
              </li>
              <li>
                <strong>Host & Guide Credentials:</strong> Tourism Regulatory Authority (TRA) license numbers, KPSGA certifications, license document scans/PDFs, license expiry dates, and verification history.
              </li>
              <li>
                <strong>Location Data:</strong> Real-time geographic coordinates (latitude and longitude) collected only with affirmative permission when hosts activate "Live Location" or when travelers search for nearby active guides on the interactive map.
              </li>
              <li>
                <strong>Communications & Preferences:</strong> In-app chat messages between hosts and guests, newsletter subscription flags (<code className="text-primary">newsletter_opt_in</code>), and travel interests.
              </li>
            </ul>
          </section>

          {/* Section 3: Tech Stack & Processing Architecture */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Lock className="size-5 text-primary" />
              3. Technology Stack & Data Architecture
            </h2>
            <p>
              Our data processing environment is architected around security-by-design principles:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Database className="size-4 text-primary" />
                  <span>Supabase PostgreSQL & Cloud Storage</span>
                </div>
                <p className="text-xs leading-relaxed">
                  User records, booking logs, and uploaded guide licenses reside in managed Supabase PostgreSQL clusters with AES-256 rest encryption and TLS 1.3 transit encryption. Database access is strictly segregated via PostgreSQL Row Level Security (RLS) policies.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Smartphone className="size-4 text-primary" />
                  <span>M-Pesa & Payment Gateways</span>
                </div>
                <p className="text-xs leading-relaxed">
                  M-Pesa mobile payments are routed through IntaSend, a licensed Central Bank of Kenya (CBK) compliant payment service provider. All payment transactions comply with global PCI-DSS standards.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Bot className="size-4 text-primary" />
                  <span>AI Travel Itineraries</span>
                </div>
                <p className="text-xs leading-relaxed">
                  When travelers request custom itineraries, algorithmic AI models process user-selected interests and destination queries. We do not sell or feed personal identifying information (PII) to public LLM training corpora.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Video className="size-4 text-primary" />
                  <span>Live Video (Daily.co WebRTC)</span>
                </div>
                <p className="text-xs leading-relaxed">
                  Live virtual tours stream over secure, encrypted WebRTC connections powered by Daily.co. Audio/video feeds are ephemeral and are not recorded or archived without explicit prior consent from all participants.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Lawful Basis under KDPA 2019 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" />
              4. Lawful Basis for Processing
            </h2>
            <p>
              In accordance with Section 30 of the Kenya Data Protection Act, 2019, we process your data on the following lawful grounds:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-4 text-sm">
              <li><strong>Performance of a Contract:</strong> Creating user accounts, matching travelers with guides, completing bookings, and dispatching M-Pesa receipts.</li>
              <li><strong>Consent:</strong> Sending email newsletters and promotional updates, which you can opt out of anytime via one-click unsubscribe links or account preferences.</li>
              <li><strong>Legal & Regulatory Obligations:</strong> Verifying host credentials under Kenyan tourism laws and maintaining financial transaction records for tax compliance (KRA).</li>
              <li><strong>Legitimate Interests:</strong> Preventing fraudulent bookings, auditing platform security, and refining recommendation algorithms.</li>
            </ul>
          </section>

          {/* Section 5: Your Statutory Data Rights */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="size-5 text-primary" />
              5. Your Rights Under the Kenya Data Protection Act
            </h2>
            <p>
              As a data subject in Kenya or using our Kenyan platform, you possess statutory rights enforceable under the KDPA:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4 text-sm">
              <li>
                <strong>Right to be Informed:</strong> To know what personal data is collected and how it is used.
              </li>
              <li>
                <strong>Right of Access & Portability:</strong> To obtain a copy of your personal data stored by Ausaguide. You can download a full archive of your profile, tours, and messages directly in <Link to="/settings" className="text-primary hover:underline font-semibold">Account Settings</Link>.
              </li>
              <li>
                <strong>Right to Rectification:</strong> To correct inaccurate, false, or outdated personal information.
              </li>
              <li>
                <strong>Right to Erasure ("Right to be Forgotten"):</strong> To request permanent deletion of your profile and data records, accessible instantly in Account Settings.
              </li>
              <li>
                <strong>Right to Object & Opt-Out:</strong> To withdraw consent for marketing newsletters at any time.
              </li>
            </ul>
            <p className="text-sm mt-2">
              To exercise any statutory right or submit a formal data complaint, write to our Data Protection Officer at <a href="mailto:privacy@ausaguide.com" className="text-primary hover:underline font-semibold">privacy@ausaguide.com</a>. If unsatisfied, you have the statutory right to lodge an administrative complaint with the <strong>Office of the Data Protection Commissioner of Kenya (ODPC)</strong> at <a href="https://www.odpc.go.ke" target="_blank" rel="noreferrer" className="text-primary hover:underline">www.odpc.go.ke</a>.
            </p>
          </section>

          {/* Section 6: Security & Cross-Border Transfers */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              6. Data Security & Cross-Border Transfers
            </h2>
            <p className="text-sm">
              Where personal data is transferred outside Kenya to global cloud infrastructure partners (e.g. Supabase, AWS, Daily.co), we ensure the receiving jurisdiction provides appropriate data safeguards compliant with Section 48 of the Kenya Data Protection Act, 2019, including Standard Contractual Clauses (SCCs) and rigorous technical encryption standards.
            </p>
          </section>

          {/* Footer */}
          <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© 2026 Ausaguide Ltd. All rights reserved. Nairobi, Kenya.</p>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
              <span>•</span>
              <a href="mailto:privacy@ausaguide.com" className="text-primary hover:underline">Data Protection Officer</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
