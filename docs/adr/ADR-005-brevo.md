# ADR-005: Why We Chose Brevo for Email

## Status
Accepted

## Context
Ausaguide must dispatch high-deliverability transactional emails, including:
- Welcome and signup confirmations.
- Booking confirmation notifications.
- Tour updates and chat notifications.
- Account deletion (GDPR) confirmation notes.

### Alternatives considered:
- **Resend**: Sleek developer experience, but pricing scaling or features like newsletter contact management are separate.
- **AWS SES (Simple Email Service)**: Low pricing but complex domain verification setup and lack of a contact CRM.
- **Brevo (formerly Sendinblue)**: Combined SMTP delivery and newsletter contact management.

---

## Decision
We chose **Brevo** as our primary transactional and marketing email provider.

### Rationale:
- **Unified Platform**: Brevo provides robust SMTP APIs for sending transactional emails (such as booking confirmations) alongside direct contact management lists for marketing newsletters.
- **Generous Free Tier**: Brevo allows up to 300 emails/day on the free tier, which is ideal for bootstrapping and testing.
- **Supabase Integration**: Simple integration using HTTP calls inside Supabase Edge Functions.

---

## Consequences

### Positive:
- Simplified API calls using standardized Brevo endpoint `https://api.brevo.com/v3/smtp/email`.
- Built-in contact lists update dynamically on newsletter checkbox opt-ins.

### Negative:
- Daily send limits on the free tier require monitoring to avoid blocking notifications (addressed by transitioning to pay-as-you-go as traffic scales).
