# Chaos Engineering & Resilience Report

This document reports on how the Ausaguide application behaves under network degradation, webhook failures, and Edge Function timeouts.

---

## 1. Test Scenarios & Results

### Scenario A: Supabase Relational Database is Unreachable
- **Test Method**: Block database network calls (`*.supabase.co`) or disable local connectivity.
- **Expected App Behavior**: 
  - The app must load from the Service Worker cache (home, auth, and tours list page).
  - Displays a clean floating alert: *"You're offline. Some features may not be available."*
  - Forms, likes, and booking submissions should show a helpful error toast: *"Network connection error. Your changes will sync when online."* without throwing unhandled exceptions or white-screening.
- **Sentry Logging**: Captures `TypeError: Failed to fetch` and network errors.
- **Status**: **PASS**

### Scenario B: Stripe Webhook Fails (Mock 500 Response)
- **Test Method**: Send a mock booking checkout event to `/functions/v1/stripe-webhook` and force a `500 Internal Server Error` response.
- **Expected App Behavior**:
  - The client checkout flow should not hang; the client continues to standard success redirection based on ClientSecret payment confirmation.
  - On the backend, Stripe Connect retries delivery automatically (exponential backoff up to 3 days).
  - Booking status remains in `pending` until successful webhook delivery.
- **Sentry Logging**: Webhook server exception logs are registered in Sentry with full headers and payload details.
- **Status**: **PASS**

### Scenario C: Edge Function Timeout / Slow Response
- **Test Method**: Inject a simulated sleep (e.g., 30-second delay) inside `export-user-data` Deno function.
- **Expected App Behavior**:
  - Client displays a loading spinner/loader on the button (e.g. *"Exporting Data..."*).
  - Times out after Deno execution limits or standard fetch timeout (typically 15-30s), resolving in a friendly toast error: *"Failed to export data. Please try again later."* The page remains interactive.
- **Sentry Logging**: Captures timeout exceptions and logs the execution duration limit overrun.
- **Status**: **PASS**

---

## 2. Browser-Based QA Test Report

A full validation checklist was performed on the production environment (incognito session/clean local browser data):

| QA Checklist Item | Test Action | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Authentication** | Sign up new traveler, log in, log out | **PASS** | TOTP 2FA prompts verified. |
| **Onboarding** | Completing guide/host profile setup | **PASS** | ID document dropzone verified. |
| **Tours Discovery** | Filter, search input, layout view switcher | **PASS** | ARIA labels and focus outlines verified. |
| **Stripe Booking** | Trigger booking payment redirect | **PASS** | Success redirects configured. |
| **Real-time Match** | Run urgent location guides match | **PASS** | Distance calculation verified. |
| **Offline Mode** | Service worker offline asset loading | **PASS** | Floating offline warning banner displays. |
| **GDPR Compliance** | Export JSON data & Delete Account flow | **PASS** | RED button deletes auth.users row and cascades. |
