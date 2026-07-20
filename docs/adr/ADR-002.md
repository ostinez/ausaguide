# ADR-002: Why We Chose React + Vite Over Next.js

## Status
Accepted

## Context
For the frontend client architecture, we needed a modern web framework that would allow us to build a rich, interactive, and responsive Single Page Application (SPA). We evaluated:
1. **Next.js**: A full-stack React framework featuring Server-Side Rendering (SSR), Static Site Generation (SSG), and Server Actions.
2. **React + Vite**: A lightweight frontend build toolchain focused on fast hot-module replacement (HMR) and static SPA packaging.

### Key Considerations:
- Highly interactive dashboard screens, map visualizations, and real-time chat elements.
- The application relies heavily on Supabase client libraries for authentication, storage, and queries.
- Rapid developer compilation and client-side performance.

---

## Decision
We chose **React + Vite** for the frontend application framework.

### Rationale:
- **Instant Hot Reloading**: Vite's ESM-based hot module replacement provides near-instant developer feedback compared to Next.js compilation speeds.
- **Client-Heavy Architecture**: Since Ausaguide acts as an interactive client application communicating directly with Supabase, Next.js server-side rendering offers negligible benefit while introducing complexity around server/client component boundaries.
- **Hosting Portability**: Compiling to a pure static build (HTML/JS/CSS) simplifies deployment, allows edge-network CDN distribution, and reduces hosting costs.

---

## Consequences

### Positive:
- Highly responsive client-side routing using `react-router-dom`.
- Extremely fast development start-up and build times.
- Simple, static caching using standard Service Workers.

### Negative:
- **SEO & Initial Page Load**: Since it is a client-side SPA, crawlers that do not execute JavaScript might see empty shells (mitigated by optimizing metadata tags and indexing structures).
