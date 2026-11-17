// Talks to Geoapify using the SECRET server key.
// "server-only" makes the build fail if any browser code ever imports this file,
// so GEOAPIFY_KEY can never leak into the website's JavaScript.
import "server-only";

import { cacheLife } from "next/cache";
import {
  type GeoapifyResult,
  type ResolvedLocation,
  pickPostcodeResult,
  pickReverseResult,
} from "./geocode";
import type { Country } from "./postalCode";

const BASE_URL = "https://api.geoapify.com/v1/geocode";

/** Thrown when Geoapify can't be reached or the key is missing/wrong. */
export class GeoapifyError extends Error {}

async function callGeoapify(path: "search" | "reverse", params: Record<string, string>) {
  const apiKey = process.env.GEOAPIFY_KEY;
  if (!apiKey) throw new GeoapifyError("GEOAPIFY_KEY is not set in .env.local");

  const url = new URL(`${BASE_URL}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("format", "json");
  url.searchParams.set("apiKey", apiKey);

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch {
    throw new GeoapifyError(`Geoapify ${path} request failed or timed out`);
  }
  // Never log `url`: it contains the key.
  if (!res.ok) throw new GeoapifyError(`Geoapify ${path} returned HTTP ${res.status}`);

  const data = (await res.json()) as { results?: GeoapifyResult[] };
  return data.results ?? [];
}

/**
 * Zip/postal code -> coordinates. Returns null if the code doesn't exist.
 * Cached: postal codes basically never move, so each code costs one API call.
 */
export async function geocodePostalCode(
  code: string,
  country: Country,
): Promise<ResolvedLocation | null> {
  "use cache";
  cacheLife("weeks");

  const results = await callGeoapify("search", {
    postcode: code,
    filter: `countrycode:${country.toLowerCase()}`,
    type: "postcode",
    limit: "5",
  });
  return pickPostcodeResult(results, country, code);
}

/**
 * Coordinates -> which country (and a friendly label).
 * Returns null if the spot is outside the US and Canada.
 * Callers should round coordinates first so nearby users share the cache.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<ResolvedLocation | null> {
  "use cache";
  cacheLife("weeks");

  const results = await callGeoapify("reverse", {
    lat: String(lat),
    lon: String(lon),
    limit: "1",
  });
  return pickReverseResult(results[0], lat, lon);
}
