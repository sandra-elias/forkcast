// Search settings for the map screen: radius units, cuisines, and URL helpers.
// Pure (no React, no network), so it's tested in search.test.ts.

import { type ResolvedLocation, isValidTimezone, parseLatLon } from "./geocode";
import type { Country } from "./postalCode";

// ---------- Radius ----------

export type RadiusConfig = {
  unit: "mi" | "km";
  unitLabel: string;
  min: number;
  max: number;
  default: number;
  metersPerUnit: number;
};

/** US uses miles, Canada uses kilometres. */
export const RADIUS: Record<Country, RadiusConfig> = {
  US: { unit: "mi", unitLabel: "miles", min: 1, max: 25, default: 5, metersPerUnit: 1609.344 },
  CA: { unit: "km", unitLabel: "kilometres", min: 1, max: 40, default: 8, metersPerUnit: 1000 },
};

export const EMPTY_MESSAGE = "No restaurants found — try a bigger radius.";

export function radiusToMeters(value: number, country: Country): number {
  return Math.round(value * RADIUS[country].metersPerUnit);
}

// ---------- Cuisines ----------
// `id` matches Geoapify's category name: catering.restaurant.<id>

export const CUISINES = [
  { id: "american", label: "American" },
  { id: "barbecue", label: "Barbecue" },
  { id: "burger", label: "Burgers" },
  { id: "chicken", label: "Chicken" },
  { id: "chinese", label: "Chinese" },
  { id: "french", label: "French" },
  { id: "greek", label: "Greek" },
  { id: "indian", label: "Indian" },
  { id: "italian", label: "Italian" },
  { id: "japanese", label: "Japanese" },
  { id: "korean", label: "Korean" },
  { id: "mediterranean", label: "Mediterranean" },
  { id: "mexican", label: "Mexican" },
  { id: "pizza", label: "Pizza" },
  { id: "sandwich", label: "Sandwiches" },
  { id: "seafood", label: "Seafood" },
  { id: "steak_house", label: "Steakhouse" },
  { id: "sushi", label: "Sushi" },
  { id: "thai", label: "Thai" },
  { id: "vietnamese", label: "Vietnamese" },
] as const;

export type CuisineId = (typeof CUISINES)[number]["id"];

// ---------- Location <-> URL ----------
// The map screen lives at /map?lat=..&lon=..&country=..&label=..
// Keeping the location in the URL means refreshing the page (or sharing the link) still works.

export function locationToSearchParams(loc: ResolvedLocation): string {
  const params = new URLSearchParams({
    lat: String(loc.lat),
    lon: String(loc.lon),
    country: loc.country,
    label: loc.label,
  });
  if (loc.timezone) params.set("tz", loc.timezone);
  return params.toString();
}

export function locationFromSearchParams(params: URLSearchParams): ResolvedLocation | null {
  const coords = parseLatLon(params.get("lat"), params.get("lon"));
  const country = params.get("country");
  if (!coords || (country !== "US" && country !== "CA")) return null;
  const label = (params.get("label") ?? "").trim().slice(0, 100) || "your location";
  const tz = params.get("tz");
  return isValidTimezone(tz) ? { ...coords, country, label, timezone: tz } : { ...coords, country, label };
}
