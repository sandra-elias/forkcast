// Shared types + pure helpers for geocoding. No network calls and no secrets,
// so this file is safe to import from tests and from browser code.

import type { Country } from "./postalCode";

/** A resolved location the rest of the app can use (map center, Places search). */
export type ResolvedLocation = {
  lat: number;
  lon: number;
  country: Country;
  /** Human-friendly name, e.g. "Los Angeles, CA 90210". */
  label: string;
  /** IANA time zone, e.g. "America/Los_Angeles". Used to decide "open now". */
  timezone?: string;
};

/** The parts of a Geoapify geocoding result we care about. */
export type GeoapifyResult = {
  lat?: number;
  lon?: number;
  country_code?: string;
  postcode?: string;
  city?: string;
  state_code?: string;
  result_type?: string;
  timezone?: { name?: string };
};

export const NOT_FOUND_MESSAGE =
  "We couldn't find that code. Double-check it and try again.";
export const LOOKUP_FAILED_MESSAGE =
  "We're having trouble finding locations right now. Please try again in a moment.";

/** Turns Geoapify's lowercase country code into one we support, or null. */
export function toSupportedCountry(code: string | undefined): Country | null {
  const upper = code?.toUpperCase();
  return upper === "US" || upper === "CA" ? upper : null;
}

function makeLabel(r: GeoapifyResult, fallbackCode?: string): string {
  const place = [r.city, r.state_code].filter(Boolean).join(", ");
  const code = r.postcode ?? fallbackCode ?? "";
  return [place, code].filter(Boolean).join(" ") || "your location";
}

function withTimezone(loc: ResolvedLocation, r: GeoapifyResult): ResolvedLocation {
  return r.timezone?.name ? { ...loc, timezone: r.timezone.name } : loc;
}

function hasCoords(r: GeoapifyResult): r is GeoapifyResult & { lat: number; lon: number } {
  return typeof r.lat === "number" && typeof r.lon === "number";
}

/**
 * Picks the result that really is the postal code we asked for.
 * Geoapify can return a "close" match; we only accept the same code in the same country.
 */
export function pickPostcodeResult(
  results: GeoapifyResult[],
  country: Country,
  code: string,
): ResolvedLocation | null {
  const wanted = code.replace(/\s/g, "").toUpperCase();
  for (const r of results) {
    const got = (r.postcode ?? "").replace(/\s/g, "").toUpperCase();
    // US results can come back as ZIP+4; compare the first 5 digits only.
    const matches = country === "US" ? got.slice(0, 5) === wanted : got === wanted;
    if (matches && toSupportedCountry(r.country_code) === country && hasCoords(r)) {
      return withTimezone({ lat: r.lat, lon: r.lon, country, label: makeLabel(r, code) }, r);
    }
  }
  return null;
}

/** Reads a reverse-geocoding result. Returns null if it's outside the US/Canada. */
export function pickReverseResult(
  r: GeoapifyResult | undefined,
  lat: number,
  lon: number,
): ResolvedLocation | null {
  const country = toSupportedCountry(r?.country_code);
  if (!r || !country) return null;
  // Keep the user's own coordinates: they're more accurate than the matched address.
  return withTimezone({ lat, lon, country, label: makeLabel(r) }, r);
}

/** Parses "lat"/"lon" query strings. Returns null if they aren't real coordinates. */
export function parseLatLon(
  latRaw: string | null,
  lonRaw: string | null,
): { lat: number; lon: number } | null {
  if (!latRaw || !lonRaw) return null;
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

/**
 * Rounds coordinates to ~100 m. Good enough for finding nearby restaurants,
 * avoids storing someone's exact position, and lets nearby lookups share a cache entry.
 */
export function roundCoord(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** True if `tz` is a real IANA time zone name like "America/Toronto". */
export function isValidTimezone(tz: string | null | undefined): tz is string {
  if (!tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
