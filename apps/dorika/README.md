# Dorika

Dorika is now separated from the Klicor application. This app is the new home for the public guide, routes, tourism content, business discovery, and the future operational platform.

## Technical Direction

Use Postgres as the source of truth for Dorika.

Recommended production stack:

- Neon Postgres through Vercel Marketplace for the primary relational database.
- PostGIS enabled from the first migration for routes, places, coordinates, and nearby discovery.
- Vercel Blob for public images, galleries, documents, and route media.
- Upstash Redis later for cache, rate limiting, ephemeral sessions, and high-traffic counters.
- Firebase only as a bridge to Klicor while syncing existing business/product data.

The database design stays portable Postgres so Dorika can move to another provider or self-hosted Postgres later without a product rewrite.

## First Commands

```bash
npm install
npm run dev
```

Initial database schema lives in:

```txt
db/migrations/0001_core.sql
```

Architecture notes live in:

```txt
docs/ARCHITECTURE.md
```
