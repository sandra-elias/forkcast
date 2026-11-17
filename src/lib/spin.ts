// Helpers for the spin + result card. Pure, so they're tested in spin.test.ts.
// (Only `import type` from places.ts, so the hours library never reaches the browser.)

import type { RestaurantWithStatus } from "./places";
import type { Country } from "./postalCode";

/**
 * Picks a random restaurant the user hasn't seen this session.
 * Returns null when every restaurant in the list has already been shown.
 * `random` is swappable so tests can be predictable.
 */
export function pickUnseen<T extends { id: string }>(
  list: T[],
  seen: ReadonlySet<string>,
  random: () => number = Math.random,
): T | null {
  const fresh = list.filter((r) => !seen.has(r.id));
  if (fresh.length === 0) return null;
  return fresh[Math.floor(random() * fresh.length)];
}

/**
 * Names to flash during the ~1.5 s spin, ending on the winner.
 * Delays start fast and slow down, like a wheel losing speed.
 */
export function buildReel(
  names: string[],
  winner: string,
  random: () => number = Math.random,
): { name: string; delayMs: number }[] {
  const others = names.filter((n) => n !== winner);
  const STEPS = 16;
  const frames: { name: string; delayMs: number }[] = [];
  for (let i = 0; i < STEPS; i++) {
    const t = i / (STEPS - 1); // 0 -> 1
    const delayMs = Math.round(40 + 150 * t * t); // 40 ms -> 190 ms, total ≈ 1.5 s
    const name = i === STEPS - 1 || others.length === 0 ? winner : others[Math.floor(random() * others.length)];
    frames.push({ name, delayMs });
  }
  return frames;
}

/** "0.4 mi" / "12 mi" in the US, "850 m" / "3.2 km" in Canada. */
export function formatDistance(meters: number, country: Country): string {
  if (country === "US") {
    const miles = meters / 1609.344;
    if (miles < 0.1) return "< 0.1 mi";
    return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
  }
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** Google Maps directions from the user's current position to the restaurant. */
export function directionsUrl(r: Pick<RestaurantWithStatus, "lat" | "lon">): string {
  const params = new URLSearchParams({ api: "1", destination: `${r.lat},${r.lon}` });
  return `https://www.google.com/maps/dir/?${params}`;
}

const DAY_NAMES: Record<string, string> = {
  Mo: "Mon",
  Tu: "Tue",
  We: "Wed",
  Th: "Thu",
  Fr: "Fri",
  Sa: "Sat",
  Su: "Sun",
  PH: "Holidays",
};

/** "Mo-Fr 11:00-22:00; Sa 12:00-23:00" -> ["Mon–Fri 11:00–22:00", "Sat 12:00–23:00"] */
export function formatHours(hours: string): string[] {
  return hours
    .split(";")
    .map((line) =>
      line
        .trim()
        .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (d) => DAY_NAMES[d])
        .replace(/(\d|[a-z])-(\d|[A-Z])/g, "$1–$2") // nicer dashes in ranges
        .replace(/,(?=\S)/g, ", ")
        .replace(/\boff\b/g, "closed"),
    )
    .filter(Boolean);
}

/** "https://www.example.com/menu" -> "example.com" for display. */
export function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Phone number -> "tel:" link value (keeps + and digits only). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
