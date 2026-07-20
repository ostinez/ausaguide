# Production-Ready Quality Assurance (QA) Checklist

This document details the quality gates and test checklists required to certify Ausaguide as a production-ready, stable marketplace deployment.

---

## 1. Functional Testing Checklist

### A. Authentication & Sign-Up
- [ ] **Email Sign-Up (Traveler/Host)**: Verify new accounts can register. Ensure verification emails are sent via Brevo.
- [ ] **Onboarding Wizard**: Confirm step-by-step gamified selection (Language preferences, avatar uploading, host certificate submissions).
- [ ] **Two-Factor Authentication (2FA)**: Verify setup and validation checks using Google Authenticator / Authy TOTP codes.
- [ ] **Reset Password Flow**: Verify forgot password emails and reset token forms.
- [ ] **Session Expiry**: Confirm that clearing LocalStorage triggers redirection back to `/auth` on protected routes.

### B. Booking & Checkout System
- [ ] **Pricing Display**: Verify in-person (physical) and virtual prices match database records.
- [ ] **Stripe Checkout**: Initiate payments with Stripe test card (`4242...`).
- [ ] **Booking Transitions**:
  - [ ] Host accepts -> funds split and payout triggered (Stripe Connect).
  - [ ] Host rejects -> payment intent canceled and refund issued.
- [ ] **Waitlist**: Join waitlist with new email, confirm email, check waitlist table.

### C. Engagement & Social Subsystems
- [ ] **Direct Messaging**: Verify text chat syncs instantly via Supabase Realtime subscriptions.
- [ ] **Media Attachments**: Confirm images upload to public buckets and render within chat dialogs.
- [ ] **Daily.co Calls**: Verify clicking "Call" launches video conference session windows.
- [ ] **Social Feed**: Create, edit, and delete community posts in `/feed`.
- [ ] **Travel Journal**: Create, edit, and delete travel logs in `/journal`.

### D. Administrative Control Panel (/admin2)
- [ ] **Access Enforcement**: Non-administrators are redirected to `/dashboard`.
- [ ] **Verifications Tab**: Approve/reject pending guides with custom message.
- [ ] **Waitlist Sync**: View waitlisted emails and trigger marketing emails.
- [ ] **Settings Toggle**: Adjust commission rates and toggle maintenance mode state.

---

## 2. UI/UX Smoothness Checklist

- [ ] **Skeleton Loaders**: Async components show loading skeletons (tours list, admin tables) rather than pop-in layouts.
- [ ] **Action Spinners**: Buttons (checkout, delete account, post submission) show loading state while requests resolve.
- [ ] **Form Validations**: Display clear, real-time feedback for weak passwords, mismatched fields, or invalid emails.
- [ ] **Responsive Outlines**: Ensure focus indicators (`outline-none focus:ring-2`) exist on all inputs.

---

## 3. Performance & Responsiveness Checklist

### A. Responsiveness Matrix
- [ ] **Mobile (375px)**: Bottom navigation bars, hamburger menus, and tappable areas (minimum 44x44px target) are functional.
- [ ] **Tablet (768px)**: Grid layouts transition smoothly from single to dual-column.
- [ ] **Desktop (1440px)**: Hero visualizers and global maps adapt with correct margins.

### B. Lighthouse Audit Baseline
- [ ] **Performance**: Score ≥ 80. Hompage loads under 3s on 3G network thresholds.
- [ ] **Accessibility (a11y)**: Score ≥ 90. Appropriate contrast ratios, image alt descriptions.
- [ ] **Best Practices**: Score ≥ 90. HTTPS active, no console warnings, dependencies clean.
- [ ] **SEO**: Score ≥ 90. Title tags, unique meta descriptions, clean header hierarchy.

---

## 4. Security Audit Checklist

- [ ] **Row Level Security (RLS)**: Active on all schemas. Run:
  `ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;`
- [ ] **Environment Variables**: Confirm no keys are hardcoded in source control. `.env` is present in `.gitignore`.
- [ ] **XSS Sanitization**: User-generated markdown in post feeds and journals is filtered using DOMPurify.
- [ ] **Signature Checks**: Verify Stripe Connect and Didit endpoints check SHA256 header signatures.
- [ ] **Vulnerabilities**: Run `npm audit` monthly to address dependencies risk items.

---

## 5. Browser Compatibility Matrix

Verify critical paths (Authentication, Checkout, Chats) on:
- [ ] **Google Chrome (Chromium)**
- [ ] **Mozilla Firefox**
- [ ] **Apple Safari (WebKit)**
- [ ] **Microsoft Edge**
