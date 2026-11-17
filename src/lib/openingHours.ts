// Decides whether a restaurant is open, using its OpenStreetMap hours string
// (e.g. "Mo-Fr 11:00-22:00; Sa 12:00-23:00") and the restaurant's local time zone.

import OpeningHours from "opening_hours";

export type OpenStatus = "open" | "closed" | "unknown";

/**
 * The current wall-clock time in `timeZone`, as a Date in this computer's own zone.
 * The hours library reads local hours/minutes, so this makes "9:30 pm in Toronto"
 * look like 9:30 pm to it, no matter where the server runs (Vercel uses UTC).
 */
export function wallClockIn(timeZone: string, now: Date): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return new Date(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
}

export function getOpenStatus(
  hours: string | undefined,
  timeZone: string,
  now: Date,
  lat: number,
  lon: number,
): OpenStatus {
  if (!hours) return "unknown";
  try {
    // lat/lon let the library handle things like "sunset". 0 = normal time-range mode.
    // (Rules that need holiday calendars, like "PH off", throw and become "unknown".)
    const oh = new OpeningHours(hours, { lat: String(lat), lon: String(lon) }, 0);
    const at = wallClockIn(timeZone, now);
    if (oh.getUnknown(at)) return "unknown";
    return oh.getState(at) ? "open" : "closed";
  } catch {
    // Hours written in a way the library can't read: don't guess.
    return "unknown";
  }
}
