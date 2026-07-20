# ADR-001: Why We Chose Supabase Over Firebase / AWS Amplify

## Status
Accepted

## Context
Ausaguide requires a backend platform to handle authentication, data storage, real-time messaging, file uploads, and edge processing. We evaluated three primary options:
1. **Firebase**: A widely-adopted Document-based NoSQL platform (Firestore).
2. **AWS Amplify**: A framework backing AWS serverless resources (DynamoDB, AppSync, Cognito).
3. **Supabase**: An open-source relational backend built on top of PostgreSQL.

### Key Considerations:
- Relational mapping is critical (hosts, travelers, tours, and bookings are strongly linked).
- Need for geospatial queries (searching tours by coordinates/distance).
- Rapid prototyping without locking ourselves into complex AWS setups.

---

## Decision
We chose **Supabase** as the core backend platform.

### Rationale:
- **Full PostgreSQL Support**: Allows relational database integrity (foreign key constraints with `ON DELETE CASCADE`), query flexibility, and complex joins, which is challenging with Firebase's NoSQL model.
- **Built-in PostGIS**: Supabase enables the Postgres GIS extension out-of-the-box, allowing performant geospatial calculations (e.g. finding hosts or tours within a radius) which would require complex geo-hashes in Firebase or custom lambdas in AWS Amplify.
- **Developer Velocity**: Supabase provides automatic REST API generation, authentication, and file storage APIs that require near-zero backend scaffolding.

---

## Consequences

### Positive:
- **Relational Integrity**: Booking structures and chat references have strict database consistency.
- **Geospatial Capabilities**: Able to run complex geographic queries using SQL directly in the database.
- **Ease of Use**: Simplifies authentication setups and triggers (e.g., auto-creating public profiles on signup).

### Negative:
- **Scale Limits**: Unlike serverless NoSQL (DynamoDB), SQL scaling requires monitoring connection limits (resolved using Supabase connection pools/PgBouncer).
