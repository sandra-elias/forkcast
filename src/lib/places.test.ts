import { describe, expect, it } from "vitest";
import { getOpenStatus, wallClockIn } from "./openingHours";
import {
  type PlaceFeature,
  type Restaurant,
  applyFilters,
  distanceMeters,
  prettyCuisine,
  safeWebsite,
  toRestaurant,
} from "./places";

// Tuesday 2026-11-17 at 20:00 UTC = 12:00 noon in Los Angeles, 15:00 in Toronto.
const TUESDAY_NOON_LA = new Date("2026-11-17T20:00:00Z");

describe("distanceMeters", () => {
  it("is zero for the same point", () => {
    expect(distanceMeters(34, -118, 34, -118)).toBe(0);
  });
  it("is about 111 km for one degree of latitude", () => {
    expect(distanceMeters(0, 0, 1, 0)).toBeGreaterThan(110000);
    expect(distanceMeters(0, 0, 1, 0)).toBeLessThan(112000);
  });
});

describe("prettyCuisine", () => {
  it("uses our labels for known cuisines", () => {
    expect(prettyCuisine("steak_house")).toBe("Steakhouse");
  });
  it("tidies unknown ones", () => {
    expect(prettyCuisine("coffee_shop")).toBe("Coffee shop");
  });
});

describe("safeWebsite", () => {
  it("keeps https links", () => {
    expect(safeWebsite("https://example.com/menu")).toBe("https://example.com/menu");
  });
  it("adds https:// when missing", () => {
    expect(safeWebsite("example.com")).toBe("https://example.com/");
  });
  it("blocks javascript: links", () => {
    expect(safeWebsite("javascript:alert(1)")).toBeUndefined();
  });
  it("handles missing values", () => {
    expect(safeWebsite(undefined)).toBeUndefined();
  });
});

describe("toRestaurant", () => {
  const feature: PlaceFeature = {
    properties: {
      place_id: "abc",
      name: "Luigi's",
      lat: 34.08,
      lon: -118.41,
      categories: ["catering", "catering.restaurant", "catering.restaurant.pizza"],
      catering: { cuisine: "pizza;italian" },
      housenumber: "123",
      street: "Main Street",
      city: "Beverly Hills",
      state_code: "CA",
      postcode: "90210",
      website: "luigis.example",
      contact: { phone: "+1 310 555 0100;+1 310 555 0101" },
      opening_hours: "Mo-Su 11:00-22:00",
    },
  };

  it("converts a full feature", () => {
    expect(toRestaurant(feature, 34.09, -118.41)).toMatchObject({
      id: "abc",
      name: "Luigi's",
      cuisine: "Pizza",
      cuisineTags: ["pizza", "italian"],
      address: "123 Main Street, Beverly Hills, CA 90210",
      website: "https://luigis.example/",
      phone: "+1 310 555 0100",
      hours: "Mo-Su 11:00-22:00",
    });
  });

  it("measures distance from the search center", () => {
    expect(toRestaurant(feature, 34.09, -118.41)?.distanceMeters).toBeCloseTo(1112, -1);
  });

  it("skips places without a name", () => {
    expect(toRestaurant({ properties: { ...feature.properties, name: " " } }, 0, 0)).toBeNull();
  });

  it("falls back to 'Restaurant' and Geoapify's address line", () => {
    const r = toRestaurant(
      { properties: { name: "Diner", lat: 1, lon: 1, address_line2: "Somewhere, Toronto, ON M5V, Canada" } },
      1,
      1,
    );
    expect(r).toMatchObject({ cuisine: "Restaurant", cuisineTags: [], address: "Somewhere, Toronto, ON M5V" });
  });
});

describe("getOpenStatus", () => {
  it("is open at noon for 11-22 hours", () => {
    expect(getOpenStatus("Mo-Su 11:00-22:00", "America/Los_Angeles", TUESDAY_NOON_LA, 34, -118)).toBe("open");
  });
  it("is closed when the place only opens for dinner", () => {
    expect(getOpenStatus("Mo-Su 17:00-22:00", "America/Los_Angeles", TUESDAY_NOON_LA, 34, -118)).toBe("closed");
  });
  it("uses the restaurant's own time zone", () => {
    // Same moment is 3 pm in Toronto: a 14:00 closing time means closed there.
    expect(getOpenStatus("Mo-Su 09:00-14:00", "America/Toronto", TUESDAY_NOON_LA, 43, -79)).toBe("closed");
    expect(getOpenStatus("Mo-Su 09:00-14:00", "America/Los_Angeles", TUESDAY_NOON_LA, 34, -118)).toBe("open");
  });
  it("is unknown with no hours or unreadable hours", () => {
    expect(getOpenStatus(undefined, "America/Los_Angeles", TUESDAY_NOON_LA, 34, -118)).toBe("unknown");
    expect(getOpenStatus("call us!", "America/Los_Angeles", TUESDAY_NOON_LA, 34, -118)).toBe("unknown");
  });
  it("handles hours past midnight", () => {
    const lateNight = new Date("2026-11-18T08:30:00Z"); // 00:30 Wednesday in LA
    expect(getOpenStatus("Tu 18:00-02:00", "America/Los_Angeles", lateNight, 34, -118)).toBe("open");
  });
});

describe("wallClockIn", () => {
  it("shows the local time in another zone", () => {
    const d = wallClockIn("America/Los_Angeles", TUESDAY_NOON_LA);
    expect([d.getDay(), d.getHours(), d.getMinutes()]).toEqual([2, 12, 0]);
  });
});

describe("applyFilters", () => {
  const base: Omit<Restaurant, "id" | "name" | "cuisineTags" | "hours"> = {
    cuisine: "x",
    lat: 34,
    lon: -118,
    distanceMeters: 100,
    address: "",
  };
  const list: Restaurant[] = [
    { ...base, id: "1", name: "Open pizza", cuisineTags: ["pizza"], hours: "Mo-Su 11:00-22:00" },
    { ...base, id: "2", name: "Closed sushi", cuisineTags: ["sushi"], hours: "Mo-Su 17:00-22:00" },
    { ...base, id: "3", name: "Mystery diner", cuisineTags: [], hours: undefined },
  ];
  const opts = { timezone: "America/Los_Angeles", now: TUESDAY_NOON_LA };

  it("open now hides closed places but keeps unknown hours", () => {
    const r = applyFilters(list, { ...opts, openNow: true, excluded: [] });
    expect(r.map((x) => [x.id, x.openStatus])).toEqual([
      ["1", "open"],
      ["3", "unknown"],
    ]);
  });

  it("without open now, keeps everything and labels it", () => {
    const r = applyFilters(list, { ...opts, openNow: false, excluded: [] });
    expect(r.map((x) => x.openStatus)).toEqual(["open", "closed", "unknown"]);
  });

  it("excludes cuisines", () => {
    const r = applyFilters(list, { ...opts, openNow: false, excluded: ["pizza", "sushi"] });
    expect(r.map((x) => x.id)).toEqual(["3"]);
  });
});
