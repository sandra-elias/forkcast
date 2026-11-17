// GET /api/places?lat=34.09&lon=-118.41&radius=8047&openNow=1&exclude=pizza,sushi&tz=America/Los_Angeles
// Returns restaurants in the circle that match the filters.
import { LOOKUP_FAILED_MESSAGE, isValidTimezone, parseLatLon, roundCoord } from "@/lib/geocode";
import { applyFilters } from "@/lib/places";
import { fetchRestaurants } from "@/lib/places.server";
import { CUISINES, type CuisineId } from "@/lib/search";

/** Slightly above 25 mi (40,234 m) and 40 km, the slider maximums. */
const MAX_RADIUS_METERS = 40500;
const KNOWN_CUISINES = new Set<string>(CUISINES.map((c) => c.id));

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  // Never trust input from the browser: check every parameter.
  const coords = parseLatLon(params.get("lat"), params.get("lon"));
  const radius = Number(params.get("radius"));
  if (!coords || !Number.isFinite(radius) || radius < 100 || radius > MAX_RADIUS_METERS) {
    return Response.json({ error: "That search doesn't look right. Please start over." }, { status: 400 });
  }
  const tzParam = params.get("tz");
  const timezone = isValidTimezone(tzParam) ? tzParam : "America/New_York";
  const openNow = params.get("openNow") === "1";
  const excluded = (params.get("exclude") ?? "")
    .split(",")
    .filter((c): c is CuisineId => KNOWN_CUISINES.has(c));

  try {
    const all = await fetchRestaurants(roundCoord(coords.lat), roundCoord(coords.lon), Math.round(radius));
    const restaurants = applyFilters(all, { openNow, excluded, timezone });
    return Response.json({ restaurants, totalInRadius: all.length });
  } catch (err) {
    console.error("[api/places]", err instanceof Error ? err.message : err);
    return Response.json(
      { error: LOOKUP_FAILED_MESSAGE.replace("finding locations", "finding restaurants") },
      { status: 502 },
    );
  }
}
