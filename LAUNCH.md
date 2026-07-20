# Ausaguide Launch Guide & Checklist

This document details the configuration steps, launch day procedures, and post-launch monitoring routines required to safely transition Ausaguide to production.

---

## 1. Pre-Launch Configuration

Prior to making the application publicly accessible, the following integrations and systems must be verified:

### A. DNS & Domain Validation
- **Domain**: Verify that `ausaguide.com` (and `www.ausaguide.com`) are correctly mapped to Vercel's nameservers or CNAME records (`cname.vercel-dns.com`).
- **SSL/TLS**: Ensure the HTTPS certificate is successfully issued and auto-renews.

### B. Stripe Production Gateway
1. Transition the Stripe Dashboard out of "Test Mode".
2. **Stripe Connect**: Configure the marketplace onboarding settings (branding, country limitations, and standard/custom account structures).
3. **Webhook Verification**:
   - Register the production endpoint: `https://[SUPABASE_PROJECT_REF].supabase.co/functions/v1/stripe-webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, and `account.updated`.
   - Copy the signing secret (`whsec_...`) and save it as `STRIPE_WEBHOOK_SECRET` in Supabase project secrets.

### C. Didit Console (KYC Integration)
1. Log in to the [Didit Console](https://console.didit.me).
2. Configure the production client credentials and copy the `DIDIT_API_KEY`.
3. Set the webhook registration URL to: `https://[SUPABASE_PROJECT_REF].supabase.co/functions/v1/didit-webhook`
4. Confirm signature verification is active.

### D. Brevo Email Verification
1. Verify the sender domain (`ausaguide.com`) inside the Brevo dashboard (add SPF, DKIM, and DMARC DNS records to your registrar).
2. Confirm the production API key is active.
3. Save the secret key as `BREVO_API_KEY` inside the Supabase Edge Function environment secrets.

---

## 2. Launch Day Checklist

On the day of launch, execute the following steps in sequence:

1. **Database Seed Validation**: Verify that the database schema is fully updated and seed test data is cleaned up (keep only default administrative/host accounts).
2. **Promote Production Build**:
   - Log in to the Vercel Dashboard.
   - Go to **Deployments**.
   - Locate the audited stable release candidate build.
   - Click the three dots (`...`) and select **Promote to Production** to activate the build globally.
3. **Trigger Waitlist Notifications**:
   - Run the promotional outreach script or notify waitlist subscribers using the newsletter list in Brevo.
4. **Onboard Pilot Hosts**:
   - Guide the first cohort of verified local hosts through signing up, verifying their identity via Didit, and listing their first tours.

---

## 3. Post-Launch Monitoring & Observability

Maintain system health and alert protocols using these channels:

### A. Error Tracking (Sentry)
- Monitor [Sentry Dashboard](https://sentry.io) for client-side exceptions or unhandled promise rejections.
- Set alerts to trigger notifications in the team communications channel if error count exceeds 1% of page views.

### B. Product Analytics (PostHog)
- Verify events (signups, booking completions, search queries, data exports) are dispatching correctly.
- Track conversion funnels to identify drops in user onboarding or payment pages.

### C. Backend Logs (Google Cloud Logging & Supabase Logs)
- Review Supabase Edge Function logs daily to verify:
  - Webhook authentications (Stripe, Didit).
  - Transaction mail dispatches (Brevo).
  - Clean account deletions (GDPR requests).
