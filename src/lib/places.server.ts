// Fetches restaurants from Geoapify Places using the SECRET server key.
import "server-only";

import { cacheLife } from "next/cache";
import { GeoapifyError } from "./geoapify.server";
import { type PlaceFeature, type Restaurant, toRestaurant } from "./places";

const PLACES_URL = "https://api.geoapify.com/v2/places";
/** Geoapify's maximum per request. We get the closest 500. */
const LIMIT = 500;

/**
 * All restaurants within `radiusMeters` of a point, closest first.
 *
 * Cached on the server for a few hours, keyed by (lat, lon, radius). Filters are
 * NOT part of the key: they're applied afterwards, so changing "open now" or
 * excluded cuisines reuses the same cached list instead of calling Geoapify again.
 * Callers should round lat/lon first so nearby searches share cache entries.
 */
export async function fetchRestaurants(lat: number, lon: number, radiusMeters: number): Promise<Restaurant[]> {
  "use cache";
  cacheLife("hours");

  const apiKey = process.env.GEOAPIFY_KEY;
  if (!apiKey) throw new GeoapifyError("GEOAPIFY_KEY is not set in .env.local");

  const url = new URL(PLACES_URL);
  url.searchParams.set("categories", "catering.restaurant");
  url.searchParams.set("filter", `circle:${lon},${lat},${radiusMeters}`);
  url.searchParams.set("bias", `proximity:${lon},${lat}`);
  url.searchParams.set("limit", String(LIMIT));
  url.searchParams.set("apiKey", apiKey);

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch {
    throw new GeoapifyError("Geoapify places request failed or timed out");
  }
  // Never log `url`: it contains the key.
  if (!res.ok) throw new GeoapifyError(`Geoapify places returned HTTP ${res.status}`);

  const data = (await res.json()) as { features?: PlaceFeature[] };
  const restaurants: Restaurant[] = [];
  const seen = new Set<string>();
  for (const f of data.features ?? []) {
    const r = toRestaurant(f, lat, lon);
    if (r && !seen.has(r.id)) {
      seen.add(r.id);
      restaurants.push(r);
    }
  }
  return restaurants;
}
