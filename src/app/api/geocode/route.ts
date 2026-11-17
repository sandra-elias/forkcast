// GET /api/geocode?code=90210
// Turns a US zip or Canadian postal code into map coordinates.
import { LOOKUP_FAILED_MESSAGE, NOT_FOUND_MESSAGE } from "@/lib/geocode";
import { geocodePostalCode } from "@/lib/geoapify.server";
import { parsePostalCode } from "@/lib/postalCode";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code") ?? "";

  // Re-check the format on the server too: never trust input from the browser.
  const parsed = parsePostalCode(code);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const location = await geocodePostalCode(parsed.code, parsed.country);
    if (!location) {
      return Response.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }
    return Response.json(location);
  } catch (err) {
    console.error("[api/geocode]", err instanceof Error ? err.message : err);
    return Response.json({ error: LOOKUP_FAILED_MESSAGE }, { status: 502 });
  }
}
