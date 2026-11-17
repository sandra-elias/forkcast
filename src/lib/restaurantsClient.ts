// Browser-side helper for /api/places with a small in-memory cache.
// The same search (location + radius + filters) within 10 minutes reuses the
// previous answer, so "Nah, spin again" is instant and costs no API calls.

import type { ResolvedLocation } from "./geocode";
import type { RestaurantWithStatus } from "./places";
import type { CuisineId } from "./search";

export type RestaurantSearch = {
  location: ResolvedLocation;
  radiusMeters: number;
  openNow: boolean;
  excluded: CuisineId[];
};

const TTL_MS = 10 * 60 * 1000; // "open now" changes over time, so don't keep results forever
const cache = new Map<string, { at: number; restaurants: RestaurantWithStatus[] }>();

export function searchKey(s: RestaurantSearch): string {
  return [
    s.location.lat.toFixed(3),
    s.location.lon.toFixed(3),
    s.radiusMeters,
    s.openNow ? "open" : "any",
    [...s.excluded].sort().join(","),
  ].join("|");
}

export async function getRestaurants(s: RestaurantSearch): Promise<RestaurantWithStatus[]> {
  const key = searchKey(s);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.restaurants;

  const params = new URLSearchParams({
    lat: String(s.location.lat),
    lon: String(s.location.lon),
    radius: String(s.radiusMeters),
    openNow: s.openNow ? "1" : "0",
    // The restaurant's time zone decides "open now"; fall back to this device's.
    tz: s.location.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  if (s.excluded.length) params.set("exclude", s.excluded.join(","));

  let res: Response;
  try {
    res = await fetch(`/api/places?${params}`);
  } catch {
    throw new Error("You seem to be offline. Check your connection and try again.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? "Something went wrong finding restaurants. Please try again.");

  if (!Array.isArray(body?.restaurants)) throw new Error("Something went wrong finding restaurants. Please try again.");
  const restaurants = body.restaurants as RestaurantWithStatus[];
  cache.set(key, { at: Date.now(), restaurants });
  return restaurants;
}
