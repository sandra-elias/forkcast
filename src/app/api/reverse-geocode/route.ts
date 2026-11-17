// GET /api/reverse-geocode?lat=43.64&lon=-79.38
// Checks whether the user's "Use my location" coordinates are in the US or Canada.
import { LOOKUP_FAILED_MESSAGE, parseLatLon, roundCoord } from "@/lib/geocode";
import { reverseGeocode } from "@/lib/geoapify.server";
import { UNSUPPORTED_MESSAGE } from "@/lib/postalCode";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const coords = parseLatLon(params.get("lat"), params.get("lon"));
  if (!coords) {
    return Response.json({ error: "Those coordinates don't look right." }, { status: 400 });
  }

  try {
    const location = await reverseGeocode(roundCoord(coords.lat), roundCoord(coords.lon));
    if (!location) {
      // 422 = "we understood the request, but can't serve this location".
      return Response.json({ error: UNSUPPORTED_MESSAGE }, { status: 422 });
    }
    return Response.json(location);
  } catch (err) {
    console.error("[api/reverse-geocode]", err instanceof Error ? err.message : err);
    return Response.json({ error: LOOKUP_FAILED_MESSAGE }, { status: 502 });
  }
}
