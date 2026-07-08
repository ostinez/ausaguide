import { FileText, ShieldAlert, BadgeCheck, Scale, AlertTriangle } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <FileText className="size-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">Terms of Use</h1>
          <p className="mt-3 text-base text-muted-foreground">Last updated: July 2, 2026</p>
        </div>

        {/* Content Card */}
        <div className="rounded-2xl border border-border bg-card/50 p-6 md:p-10 shadow-lg backdrop-blur-sm space-y-8 text-muted-foreground leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BadgeCheck className="size-5 text-teal" />
              1. Acceptance of Terms
            </h2>
            <p>
              Welcome to Ausaguide. By accessing or using our platform, website, and services, you agree to comply with and be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, please do not use the website or services. These Terms constitute a binding legal agreement between you and Ausaguide.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="size-5 text-teal" />
              2. User Accounts
            </h2>
            <p>
              To access certain features of the platform, you must register and create an account. You agree to provide accurate, current, and complete information during registration and to keep your account details updated.
            </p>
            <p>
              You are entirely responsible for maintaining the confidentiality of your account credentials and password. You agree to notify us immediately of any unauthorized use or suspected breach of security. Ausaguide will not be liable for any losses caused by unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Scale className="size-5 text-teal" />
              3. Booking & Payments
            </h2>
            <p>
              Ausaguide enables travelers to book tours offered by local hosts. All bookings are processed through our secure third-party payment partner, Stripe.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li><strong>Pricing:</strong> Prices are set by hosts and display on listing pages. Service fees or commissions may apply.</li>
              <li><strong>Cancellation by Traveler:</strong> Cancellations made more than 48 hours before the scheduled tour time are eligible for a full refund. Cancellations within 48 hours are non-refundable.</li>
              <li><strong>Cancellation by Host:</strong> If a host cancels a booking, the traveler will receive a full refund automatically.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BadgeCheck className="size-5 text-teal" />
              4. Host Responsibilities
            </h2>
            <p>
              Hosts are independent service providers and not employees or agents of Ausaguide. As a host, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>All information provided in your listings (including pricing, location, descriptions, and availability) is accurate and not misleading.</li>
              <li>You possess all necessary licenses, certifications, and approvals required to conduct tours under applicable local regulations.</li>
              <li>You will prioritize traveler safety, act professionally, and maintain clean and safe environments during tours.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BadgeCheck className="size-5 text-teal" />
              5. Traveler Responsibilities
            </h2>
            <p>
              As a traveler on Ausaguide, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Provide accurate personal information and contact details during checkout.</li>
              <li>Respect hosts, local cultures, guidelines, and safety rules set for each experience.</li>
              <li>Refrain from engaging in unlawful, abusive, or disruptive behavior during any tour.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Scale className="size-5 text-teal" />
              6. Intellectual Property
            </h2>
            <p>
              The platform design, text, graphics, logos, images, software, and other content are the exclusive property of Ausaguide or its licensors. You may not copy, reproduce, distribute, or modify any part of our platform without prior written consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="size-5 text-teal" />
              7. Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your account or restrict your access to the platform at any time, without notice, for any violation of these Terms, or for behavior that we deem harmful to the Ausaguide community or our brand.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="size-5 text-teal" />
              8. Limitation of Liability
            </h2>
            <p>
              Ausaguide is a marketplace platform connecting travelers and hosts. We do not own, manage, or run the tours listed. Consequently, Ausaguide is not liable for any direct, indirect, incidental, or consequential damages resulting from your interactions with other users, booking experiences, or tour participation, including physical injury, property damage, or delays.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Scale className="size-5 text-teal" />
              9. Dispute Resolution & Governing Law
            </h2>
            <p>
              These Terms and your use of Ausaguide shall be governed by, construed, and enforced in accordance with the laws of <strong>Kenya</strong>, without regard to conflict of law principles. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Kenya.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
