# ADR-003: Why We Chose Stripe Connect for Payments

## Status
Accepted

## Context
Ausaguide acts as a double-sided marketplace linking travelers with local hosts. Therefore, the payment infrastructure needs to:
1. Accept payments from international travelers.
2. Distribute payouts to local hosts (in various local currencies and methods, e.g., mobile money like M-Pesa).
3. Handle refunds, commission cuts (platform fees), and disputed charges.

### Alternatives considered:
- **PayPal Marketplace / Braintree**: Strong international reach but complex integration and higher checkout friction.
- **Direct Stripe Payments + Manual Bank Transfers**: High administrative overhead and compliance risks regarding host payouts.
- **Stripe Connect**: Stripe's dedicated product for multi-sided marketplace payout routing.

---

## Decision
We chose **Stripe Connect** as our payment and payout gateway.

### Rationale:
- **Automatic Split Payments**: Stripe Connect allows us to charge a traveler, deduct a platform fee, and route the remaining balance directly to the host's connected Stripe account.
- **Compliance & KYC**: Stripe handles regulatory compliance (Know Your Customer / AML) for hosts, saving Ausaguide from storing sensitive financial info.
- **Global Payout Options**: Enables cross-border transfers and local payment routing options.

---

## Consequences

### Positive:
- Reduces platform liability regarding traveler fund management.
- Streamlines the checkout experience with Stripe Checkout elements (supporting credit cards, Apple Pay, Google Pay).
- Automates platforms fee deductions.

### Negative:
- Hosts must complete a Stripe onboarding flow, which may introduce minor signup friction.
- Transaction fees are higher than direct peer-to-peer alternatives.
