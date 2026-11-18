# Forkcast

**Restaurant roulette for when nobody can decide what's for dinner.**

Enter a US zip code or Canadian postal code (or share your location), set how far you're willing to go, and spin. Forkcast picks a nearby restaurant for you, with directions one tap away.

## Features

- **Zip or postal code, or your location.** Detects US ZIP (incl. ZIP+4) vs. Canadian postal codes automatically; anywhere else gets a friendly "US and Canada only" message.
- **Map with a search radius** (5 mi / 8 km by default, up to 25 mi / 40 km) that follows your system's light or dark mode.
- **Filters:** "open now" (on by default) and cuisines to exclude.
- **The spin:** names cycle for about 1.5 seconds, then land on a result card with cuisine, distance, address, and hours, phone, and website when available.
- **Get directions** opens Google Maps. **Spin again** never repeats a restaurant in the same session.
- **Accessible:** keyboard and screen-reader friendly, meets WCAG AA contrast, and respects "reduce motion".

## How it works

- **Next.js (App Router), TypeScript, Tailwind CSS**, deployed on **Vercel**.
- **Geoapify** Geocoding (forward and reverse) and Places APIs, called **only from server API routes**, so the secret key never reaches the browser (enforced with `server-only`).
- **Leaflet / react-leaflet** map with Geoapify tiles.
- **"Open now"** is computed from OpenStreetMap opening-hours strings in the restaurant's own time zone, using [`opening_hours`](https://github.com/opening-hours/opening_hours.js).
- **Two layers of caching:** server-side (`"use cache"`) per location and radius, so filter changes don't cost API calls, and in the browser per search, so "Spin again" is instant.
- **Privacy:** browser location is rounded to about 100 m before it leaves the device.
- **Tests:** 84 Vitest tests cover validation, geocoding, opening hours, filtering and spin logic.

Restaurant data comes from OpenStreetMap, so there are no ratings or prices, and hours are only shown when listed.

## Credits

Map tiles and data: [Geoapify](https://www.geoapify.com/), [OpenMapTiles](https://openmaptiles.org/), and [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
