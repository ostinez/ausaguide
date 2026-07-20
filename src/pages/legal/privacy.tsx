import { Shield, Eye, Database, Share2, HelpCircle } from "lucide-react"
import { Link } from "react-router-dom"

export default function PrivacyPage() {
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
            <Shield className="size-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">Privacy Policy</h1>
          <p className="mt-3 text-base text-muted-foreground">Last updated: July 2, 2026</p>
        </div>

        {/* Content Card */}
        <div className="rounded-2xl border border-border bg-card/50 p-6 md:p-10 shadow-lg backdrop-blur-sm space-y-8 text-muted-foreground leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Eye className="size-5 text-teal" />
              1. Data Controller Information
            </h2>
            <p>
              Ausaguide ("we", "us", or "our") acts as the data controller for the personal information collected through our platform. We are committed to protecting and respecting your privacy in compliance with applicable data protection laws. If you have any questions or concerns regarding this policy, you can contact us at <a href="mailto:welcome@ausaguide.com" className="text-primary hover:underline">welcome@ausaguide.com</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Database className="size-5 text-teal" />
              2. What Data We Collect
            </h2>
            <p>
              We collect information that you provide to us directly or that is generated automatically when you use our platform:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li><strong>Account Information:</strong> Name, email address, password, profile picture, and role details.</li>
              <li><strong>Booking Details:</strong> Tourist names, email addresses, phone numbers, date, time, and special notes.</li>
              <li><strong>Location Data:</strong> With your consent, we collect precise live location coordinates (latitude and longitude) of hosts while location sharing is enabled. This is used solely to display active host positions on the interactive map.</li>
              <li><strong>Host Profiles:</strong> Bios, location, languages, guides verification statuses, and license uploads.</li>
              <li><strong>Interactive Data:</strong> Chat messages, support history, reviews, and favorites.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, and platform activity data.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Database className="size-5 text-teal" />
              3. Why We Collect It & Legal Basis
            </h2>
            <p>
              We process your personal information under the following legal bases:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li><strong>Performance of a Contract:</strong> To manage user account setups, process bookings, handle payouts, and host-traveler chats.</li>
              <li><strong>Consent:</strong> For marketing communications, specific cookies, or locations, which you can withdraw at any time.</li>
              <li><strong>Legitimate Interests:</strong> To improve our platform, prevent fraud, run analytics, and secure our system infrastructure.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="size-5 text-teal" />
              4. Data Storage & Protection
            </h2>
            <p>
              We adopt industry-standard security measures to guard against unauthorized access, alteration, disclosure, or destruction of your personal data. All account and tour data is safely stored in encrypted databases hosted by <strong>Supabase</strong>. 
            </p>
            <p>
              While we make every effort to secure your personal data, no transmission method over the internet is completely bulletproof. We encourage users to maintain secure passwords and notify us immediately of any security issues.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="size-5 text-teal" />
              5. Your Rights & GDPR/CCPA Compliance
            </h2>
            <p>
              Depending on your location, you possess specific data rights under regulations such as the General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA), which include:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li><strong>Access & Portability:</strong> The right to request copies of the personal data we hold about you. You can instantly download a complete JSON archive of your personal information (profile, tours, bookings, messages, posts, and journals) via the <Link to="/settings" className="text-primary hover:underline">Profile Settings</Link> page under the "Privacy" tab.</li>
              <li><strong>Correction:</strong> The right to request correction of inaccurate or incomplete personal information.</li>
              <li><strong>Deletion ("Right to be Forgotten"):</strong> The right to request that we erase your personal data. You can permanently delete your account and all associated records immediately via the <Link to="/settings" className="text-primary hover:underline">Profile Settings</Link> page under the "Privacy" tab.</li>
              <li><strong>Consent Withdrawal:</strong> The right to withdraw consent for specific processing actions (such as newsletters).</li>
            </ul>
            <p>
              To exercise any of these rights manually, or if you require additional assistance, please submit a request to our data protection officer at <a href="mailto:welcome@ausaguide.com" className="text-primary hover:underline">welcome@ausaguide.com</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Share2 className="size-5 text-teal" />
              6. Third-Party Sharing
            </h2>
            <p>
              We share data with trusted third-party services to perform essential platform operations:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Supabase:</strong> For database storage, backend authentication, and user data hosting.</li>
              <li><strong>Stripe:</strong> For processing secure payment transactions and verifying host payouts. We do not store full credit card details.</li>
              <li><strong>Daily:</strong> For powering live virtual tour video rooms and audio connections.</li>
              <li><strong>Mapbox:</strong> For rendering interactive maps showing coordinates and host locations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="size-5 text-teal" />
              7. Cookies & Tracking
            </h2>
            <p>
              We use cookies and similar browser storage mechanisms to authenticate your session, remember your roles, and monitor dashboard analytics. You can adjust your browser settings to decline cookies, though some platform features may cease to function correctly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="size-5 text-teal" />
              8. COPPA Compliance (Children's Privacy)
            </h2>
            <p>
              Ausaguide does not target, market to, or knowingly collect personal information from children under the age of 13. If we discover that a child under 13 has registered or provided personal data, we will immediately delete their information and deactivate the account.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
