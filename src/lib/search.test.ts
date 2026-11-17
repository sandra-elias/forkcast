import { describe, expect, it } from "vitest";
import {
  CUISINES,
  RADIUS,
  locationFromSearchParams,
  locationToSearchParams,
  radiusToMeters,
} from "./search";

describe("radius", () => {
  it("defaults to 5 mi in the US and 8 km in Canada", () => {
    expect(RADIUS.US).toMatchObject({ unit: "mi", default: 5, max: 25 });
    expect(RADIUS.CA).toMatchObject({ unit: "km", default: 8, max: 40 });
  });

  it("converts to meters", () => {
    expect(radiusToMeters(5, "US")).toBe(8047);
    expect(radiusToMeters(25, "US")).toBe(40234);
    expect(radiusToMeters(8, "CA")).toBe(8000);
  });
});

describe("cuisines", () => {
  it("has unique ids", () => {
    const ids = CUISINES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("location URL params", () => {
  const loc = { lat: 34.09, lon: -118.41, country: "US" as const, label: "Los Angeles, CA 90210" };

  it("round-trips a location", () => {
    const qs = locationToSearchParams(loc);
    expect(locationFromSearchParams(new URLSearchParams(qs))).toEqual(loc);
  });

  it("rejects an unsupported country", () => {
    expect(locationFromSearchParams(new URLSearchParams("lat=1&lon=2&country=GB"))).toBeNull();
  });

  it("rejects missing or bad coordinates", () => {
    expect(locationFromSearchParams(new URLSearchParams("country=US"))).toBeNull();
    expect(locationFromSearchParams(new URLSearchParams("lat=999&lon=2&country=US"))).toBeNull();
  });

  it("falls back to a generic label", () => {
    expect(locationFromSearchParams(new URLSearchParams("lat=1&lon=2&country=CA"))?.label).toBe(
      "your location",
    );
  });
});
