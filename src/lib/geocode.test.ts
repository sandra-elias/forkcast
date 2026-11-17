import { describe, expect, it } from "vitest";
import { parseLatLon, pickPostcodeResult, pickReverseResult, roundCoord } from "./geocode";

describe("pickPostcodeResult", () => {
  const la = {
    lat: 34.09,
    lon: -118.41,
    postcode: "90210",
    city: "Los Angeles",
    state_code: "CA",
    country_code: "us",
  };

  it("accepts an exact US match and builds a label", () => {
    expect(pickPostcodeResult([la], "US", "90210")).toEqual({
      lat: 34.09,
      lon: -118.41,
      country: "US",
      label: "Los Angeles, CA 90210",
    });
  });

  it("keeps the time zone when Geoapify provides one", () => {
    const r = pickPostcodeResult([{ ...la, timezone: { name: "America/Los_Angeles" } }], "US", "90210");
    expect(r?.timezone).toBe("America/Los_Angeles");
  });

  it("accepts a US result returned as ZIP+4", () => {
    expect(pickPostcodeResult([{ ...la, postcode: "90210-1234" }], "US", "90210")).not.toBeNull();
  });

  it("rejects a different (fuzzy) postcode", () => {
    expect(pickPostcodeResult([{ ...la, postcode: "90211" }], "US", "90210")).toBeNull();
  });

  it("rejects a result from the wrong country", () => {
    expect(pickPostcodeResult([{ ...la, country_code: "mx" }], "US", "90210")).toBeNull();
  });

  it("matches Canadian codes regardless of spacing/case", () => {
    const toronto = { lat: 43.64, lon: -79.38, postcode: "M5V 3L9", city: "Toronto", state_code: "ON", country_code: "ca" };
    expect(pickPostcodeResult([toronto], "CA", "M5V 3L9")?.label).toBe("Toronto, ON M5V 3L9");
  });

  it("returns null when there are no results", () => {
    expect(pickPostcodeResult([], "US", "00000")).toBeNull();
  });

  it("skips results without coordinates", () => {
    expect(pickPostcodeResult([{ ...la, lat: undefined }], "US", "90210")).toBeNull();
  });
});

describe("pickReverseResult", () => {
  it("accepts Canada and keeps the user's coordinates", () => {
    const r = { lat: 1, lon: 2, country_code: "ca", city: "Toronto", state_code: "ON", postcode: "M5V 2W6" };
    expect(pickReverseResult(r, 43.643, -79.387)).toEqual({
      lat: 43.643,
      lon: -79.387,
      country: "CA",
      label: "Toronto, ON M5V 2W6",
    });
  });

  it("rejects the UK", () => {
    expect(pickReverseResult({ country_code: "gb" }, 51.5, -0.12)).toBeNull();
  });

  it("rejects the middle of the ocean (no country)", () => {
    expect(pickReverseResult({ country_code: undefined }, 30, -40)).toBeNull();
  });

  it("rejects a missing result", () => {
    expect(pickReverseResult(undefined, 30, -40)).toBeNull();
  });
});

describe("parseLatLon", () => {
  it("parses valid coordinates", () => {
    expect(parseLatLon("43.64", "-79.38")).toEqual({ lat: 43.64, lon: -79.38 });
  });

  it.each([
    [null, "1"],
    ["1", null],
    ["abc", "1"],
    ["91", "0"],
    ["0", "-181"],
    ["", ""],
  ])("rejects lat=%j lon=%j", (lat, lon) => {
    expect(parseLatLon(lat, lon)).toBeNull();
  });
});

describe("roundCoord", () => {
  it("rounds to 3 decimal places", () => {
    expect(roundCoord(43.642634)).toBe(43.643);
    expect(roundCoord(-79.387149)).toBe(-79.387);
  });
});
