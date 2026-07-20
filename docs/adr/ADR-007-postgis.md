# ADR-007: Why We Chose PostGIS for Geospatial Queries

## Status
Accepted

## Context
Ausaguide features an interactive map displaying locations of active tours and nearby host guides.
We need to:
1. Query hosts and tours within a certain radius of the traveler.
2. Filter tours by geographic boundaries (cities, neighborhoods).
3. Ensure location queries are performant as the number of listings grows.

### Alternatives considered:
- **Client-side Calculations**: Fetching all listings and calculating coordinates client-side (unscalable, high bandwidth consumption).
- **Geohashing (NoSQL standard)**: Representing locations as strings (Firebase standard). Simple but struggles with precise circle/distance calculations.
- **PostGIS**: A mature, spatial database extender for PostgreSQL database.

---

## Decision
We chose **PostGIS** for database geographic queries.

### Rationale:
- **True Geospatial Calculations**: PostGIS provides native spatial functions (such as `ST_DWithin`, `ST_Distance`, and `ST_MakePoint`) that perform math inside the database layer, returning only matching rows.
- **Spatial Indexing**: Using GIST spatial index (`CREATE INDEX ON tours USING gist (...)`) ensures that location lookups execute in milliseconds even with millions of listings.
- **Supabase Integration**: Available with a single click/command: `create extension if not exists postgis;`.

---

## Consequences

### Positive:
- Highly performant geo-queries.
- Simplifies backend code (complex spatial calculations are handled in Postgres functions).

### Negative:
- Requires basic understanding of spatial coordinate projection standards (e.g. WGS 84 / SRID 4326).
