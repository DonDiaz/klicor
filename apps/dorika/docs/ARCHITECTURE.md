# Dorika Architecture

## Product Boundary

Dorika is not a Klicor module. Klicor remains the simple operating tool for small businesses. Dorika becomes a public discovery and business platform with its own domain, data model, admin, and future operational depth.

The relationship should be a bridge, not a dependency:

- Klicor can publish selected businesses/products into Dorika.
- Dorika stores its own routes, places, progress, favorites, editorial content, and future reservations.
- Dorika should not use Firestore as its main database.

## Database Choice

Use Postgres as the long-term core.

Preferred provider now: Neon Postgres through Vercel Marketplace.

Reasons:

- Relational data fits routes, stops, places, businesses, bookings, POS, invoices, payments, and accounting.
- PostGIS supports coordinates, route points, distance queries, polygons, and nearby discovery.
- SQL keeps reporting and analytics much stronger than document reads.
- The schema is portable if Dorika later moves to a dedicated backend or self-hosted database.
- Vercel integration keeps deployment and environment variables simple at this stage.

Use Vercel Blob for media instead of storing image files in the database.

Use Upstash Redis later for:

- rate limiting
- hot route caches
- temporary sessions
- counters
- lightweight queues

## What Not To Put In Firestore

Do not put these Dorika-owned datasets in Firestore:

- tourist routes
- route points
- place catalog
- user route progress
- favorites
- badges
- editorial collections
- future reservations
- POS sales
- invoices
- accounting entries

Firestore can remain useful as a Klicor source while we sync public business data into Dorika.

## Data Domains

Dorika should grow by bounded areas:

- Discovery: businesses, products, places, routes, categories, tags.
- Tourism: route points, badges, progress, favorites, map positions.
- Commerce bridge: synced Klicor businesses and product references.
- Reservations: experiences, availability, booking requests, payments.
- Operations: POS, sales, inventory, invoices.
- Accounting: ledger accounts, journal entries, reconciliations.

The first migration focuses on the Discovery and Tourism domains without blocking future modules.

## Map Direction

Start with a Dorika-owned visual map:

- custom illustrated canvas
- route line drawn by Dorika
- configurable x/y positions for each point
- optional latitude/longitude stored for future geospatial features

Do not depend on Google Maps as the main experience. A "Ver ubicación" action can exist later, but the core route experience should feel like Dorika, not a technical map embed.

Future real map layer:

- MapLibre GL JS
- PostGIS for stored coordinates
- optional PMTiles/Protomaps if we need low-cost custom vector maps

## Deployment Boundary

Deploy Dorika as a separate Vercel project from the `apps/dorika` directory.

After the new project is live:

- move `dorika.com.co` from the Klicor Vercel project to the Dorika Vercel project
- keep `klicor.com` focused on Klicor only
- keep DNS in Cloudflare
