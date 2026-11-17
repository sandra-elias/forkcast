// Turning Geoapify "places" into the restaurants Forkcast shows, plus filtering.
// Pure (no network), so it's tested in places.test.ts.

import { getOpenStatus, type OpenStatus } from "./openingHours";
import { CUISINES, type CuisineId } from "./search";

/** One restaurant, trimmed down to what the app needs. */
export type Restaurant = {
  id: string;
  name: string;
  /** Display label, e.g. "Italian" or "Restaurant". */
  cuisine: string;
  /** Lowercase cuisine tags used for "exclude cuisines", e.g. ["pizza", "italian"]. */
  cuisineTags: string[];
  lat: number;
  lon: number;
  distanceMeters: number;
  address: string;
  website?: string;
  phone?: string;
  /** Raw OpenStreetMap hours, e.g. "Mo-Fr 11:00-22:00". */
  hours?: string;
};

/** A restaurant plus whether it's open right now. Sent to the browser. */
export type RestaurantWithStatus = Restaurant & { openStatus: OpenStatus };

/** The parts of a Geoapify Places feature we read. */
export type PlaceFeature = {
  properties: {
    place_id?: string;
    name?: string;
    lat?: number;
    lon?: number;
    categories?: string[];
    catering?: { cuisine?: string };
    housenumber?: string;
    street?: string;
    city?: string;
    state_code?: string;
    postcode?: string;
    address_line2?: string;
    website?: string;
    contact?: { phone?: string };
    opening_hours?: string;
  };
};

// ---------- Distance ----------

/** Straight-line distance between two points on Earth, in meters (haversine formula). */
export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

// ---------- Cleaning up fields ----------

const KNOWN_LABELS: Record<string, string> = Object.fromEntries(CUISINES.map((c) => [c.id, c.label]));

/** "steak_house" -> "Steakhouse", "coffee_shop" -> "Coffee shop". */
export function prettyCuisine(tag: string): string {
  if (KNOWN_LABELS[tag]) return KNOWN_LABELS[tag];
  const words = tag.replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Only allow real web links (blocks things like "javascript:" that could run code). */
export function safeWebsite(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function cuisineTagsOf(p: PlaceFeature["properties"]): string[] {
  const tags = new Set<string>();
  for (const c of p.categories ?? []) {
    const m = c.match(/^catering\.restaurant\.(.+)$/);
    if (m) tags.add(m[1].toLowerCase());
  }
  // OpenStreetMap's own tag can list several: "pizza;italian"
  for (const c of (p.catering?.cuisine ?? "").split(/[;,]/)) {
    const t = c.trim().toLowerCase();
    if (t) tags.add(t);
  }
  return [...tags];
}

function addressOf(p: PlaceFeature["properties"]): string {
  const street = [p.housenumber, p.street].filter(Boolean).join(" ");
  const region = [p.state_code, p.postcode].filter(Boolean).join(" ");
  const built = [street, p.city, region].filter(Boolean).join(", ");
  if (street) return built;
  // No street? Fall back to Geoapify's line, minus the country name.
  return (p.address_line2 ?? built).replace(/,\s*(United States of America|United States|Canada)$/, "");
}

/** Converts one Geoapify feature. Returns null for places we can't show (no name/coords). */
export function toRestaurant(f: PlaceFeature, centerLat: number, centerLon: number): Restaurant | null {
  const p = f.properties;
  const name = p.name?.trim();
  if (!name || typeof p.lat !== "number" || typeof p.lon !== "number") return null;

  const cuisineTags = cuisineTagsOf(p);
  return {
    id: p.place_id ?? `${p.lat},${p.lon},${name}`,
    name,
    cuisine: cuisineTags.length ? prettyCuisine(cuisineTags[0]) : "Restaurant",
    cuisineTags,
    lat: p.lat,
    lon: p.lon,
    distanceMeters: distanceMeters(centerLat, centerLon, p.lat, p.lon),
    address: addressOf(p),
    website: safeWebsite(p.website),
    phone: p.contact?.phone?.split(";")[0].trim() || undefined,
    hours: p.opening_hours?.trim() || undefined,
  };
}

// ---------- Filtering ----------

export type FilterOptions = {
  openNow: boolean;
  excluded: CuisineId[];
  timezone: string;
  now?: Date;
};

/**
 * Applies the user's filters and works out open/closed for each restaurant.
 * - "Open now" removes places whose hours say they're closed; places with
 *   no hours stay in (shown as "hours unknown").
 * - Excluding a cuisine removes any place tagged with it.
 */
export function applyFilters(list: Restaurant[], opts: FilterOptions): RestaurantWithStatus[] {
  const excluded = new Set<string>(opts.excluded);
  const now = opts.now ?? new Date();
  const out: RestaurantWithStatus[] = [];
  for (const r of list) {
    if (r.cuisineTags.some((t) => excluded.has(t))) continue;
    const openStatus = getOpenStatus(r.hours, opts.timezone, now, r.lat, r.lon);
    if (opts.openNow && openStatus === "closed") continue;
    out.push({ ...r, openStatus });
  }
  return out;
}
