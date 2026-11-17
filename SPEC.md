# Forkcast — Restaurant Roulette (MVP)

App name: **Forkcast** (page title, big landing headline, browser tab).
Tagline under it, in small text: **"What's for dinner?"**
Style: modern and minimal, no emojis. Black & white only (no accent color);
Headline font Space Grotesk (medium weight), body font Inter.

## Scope: US and Canada only

## User flow
1. Landing: "Forkcast" headline with "What's for dinner?" tagline, one input "Enter zip or postal
   code", and a "Use my location" button (browser geolocation).
   - Valid formats: US = 5 digits (ZIP+4 ok); Canada = A1A 1A1
     (space optional, any case). Figure out the country from the format.
   - If the input isn't a US or Canadian format, show: "Sorry, we only
     support US zip codes and Canadian postal codes right now."
   - If "Use my location" is outside the US or Canada (check with Geoapify
     reverse geocoding), show the same message.
   - If location permission is denied, ask them to enter a code instead.
2. Map screen: map centered on the location with the radius as a circle.
   - Default radius 5 mi (US) / 8 km (CA); slider up to 25 mi / 40 km.
   - Filters (collapsible): open now (default ON), exclude cuisines.
   - Big SPIN button.
3. Result: ~1.5s spin animation cycling names, then a card with name,
   cuisine, distance, address, website/phone/hours if present.
   Buttons: "Get directions" (Google Maps directions link) and
   "Spin again" (no repeats in a session).
   Empty state: "No restaurants found — try a bigger radius."

## Tech
- Next.js (App Router) + TypeScript + Tailwind, deploy on Vercel.
- Geoapify Geocoding API (forward + reverse) and Places API
  (categories=catering.restaurant, filter=circle:lon,lat,radius_m),
  called ONLY from server API routes using GEOAPIFY_KEY.
- Map: react-leaflet (client-only) with Geoapify tiles using
  NEXT_PUBLIC_GEOAPIFY_MAP_KEY, with required attribution.
- Cache Places results per location/radius/filters; spin again uses cache.
- Data is OpenStreetMap-based: no ratings or prices. "Open now" excludes
  places whose hours say closed. Places with no hours stay in the spin, and
  the card simply doesn't mention hours (no "hours unknown" label, since
  most places have none). Show "Open now"/"Closed now" and the hours only
  when known.
- Mobile-first, friendly loading and error states.
- .env.local must be in .gitignore; create .env.example with empty values.

## Out of scope
Accounts, group rooms, favorites, ratings, price filter, analytics.

## Stages
1. Tool check + project setup + git init + .env.local
2. Landing page + validation (with Vitest tests)
3. Geocoding API routes (forward + reverse)
4. Map screen with radius + filters
5. Places API route + caching
6. Spin animation + result card
7. Full review: bugs, exposed keys, accessibility, mobile
8. Create GitHub repo "forkcast", push, and deploy to Vercel
