# ADR-004: Why We Chose Didit for Identity Verification

## Status
Accepted

## Context
Ausaguide operates as a local guide booking platform where trust and safety are paramount. Hosts are allowed to invite travelers into remote nature reserves, urban neighborhoods, and private homes. To ensure platform safety, we must:
1. Verify the real-world identity of hosts.
2. Confirm host government-issued ID documents.
3. Keep verification details secure and comply with local privacy regulations.

### Alternatives considered:
- **Persona / Veriff**: Premium identity verification tools, but costly for early-stage platforms.
- **Manual Verification (email uploads)**: Extremely high security/privacy risk (storing raw ID documents on database buckets) and high operational overhead.
- **Didit**: A modern, decentralized identity protocol providing secure KYC/verification workflows.

---

## Decision
We chose **Didit** for host identity verification.

### Rationale:
- **Secure Document Processing**: Didit manages the OCR document reading and liveness checks on their secure infrastructure, protecting Ausaguide from handling raw, unencrypted passport/ID files.
- **Webhook Integration**: Didit provides easy webhook triggers upon session completion, allowing the application to update `public.profiles.is_verified` state in real-time.
- **Web3 / Decentralized Identity Alignment**: Keeps open standards for digital ID and cryptographic verification.

---

## Consequences

### Positive:
- Protects the database from containing high-risk personally identifiable information (PII) like passports.
- Automated ID verification workflow triggers.

### Negative:
- Webhook endpoints require secure validation (e.g. validating Didit signatures) to prevent malicious verification updates.
