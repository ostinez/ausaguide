# ADR-006: Why We Chose Vercel for Hosting

## Status
Accepted

## Context
For deploying, hosting, and scaling our React + Vite static frontend, we required a platform that provides:
1. High deliverability and low latency via global CDNs.
2. Direct integration with our GitHub repository (continuous integration / continuous deployment).
3. Near-zero configuration management.
4. Support for fast recovery/rollbacks.

### Alternatives considered:
- **Netlify**: Similar static hosting, but slightly slower cold starts and build pipeline processing in some regions.
- **AWS S3 + CloudFront**: Highly customizable but complex cloud infrastructure configuration, manual routing rules setup for SPAs (handling 404 fallback routing), and separate CI/CD pipelines.
- **Vercel**: High-performance deployment platform built for modern frontends.

---

## Decision
We chose **Vercel** for frontend deployment and hosting.

### Rationale:
- **Git-Ops Deployments**: Merging changes into the `main` branch triggers an automatic production build and deployment.
- **Instant Rollbacks**: If a bug is introduced, reverting takes a single click inside the Vercel Dashboard (RTO is reduced to seconds).
- **Edge Performance**: Vercel automatically deploys static assets to a global edge network, minimizing page-load latency.

---

## Consequences

### Positive:
- Simplified SPA routing handling: `vercel.json` rewrites make client-side routes (e.g. `/tours`, `/settings`) work automatically without 404 errors.
- Previews for each pull request.

### Negative:
- High serverless execution pricing if migrating backend API logic directly into Vercel Serverless functions (minimized by keeping API processing strictly in Supabase Edge Functions).
