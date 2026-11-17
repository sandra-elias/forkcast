import { describe, expect, it } from "vitest";
import {
  buildReel,
  directionsUrl,
  displayHost,
  formatDistance,
  formatHours,
  pickUnseen,
  telHref,
} from "./spin";

const list = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("pickUnseen", () => {
  it("never returns a restaurant already seen", () => {
    for (let i = 0; i < 50; i++) {
      expect(pickUnseen(list, new Set(["a", "c"]))?.id).toBe("b");
    }
  });
  it("returns null when everything has been seen", () => {
    expect(pickUnseen(list, new Set(["a", "b", "c"]))).toBeNull();
  });
  it("uses the random number to choose", () => {
    expect(pickUnseen(list, new Set(), () => 0)?.id).toBe("a");
    expect(pickUnseen(list, new Set(), () => 0.99)?.id).toBe("c");
  });
});

describe("buildReel", () => {
  const names = ["Alpha", "Bravo", "Charlie", "Delta"];
  it("ends on the winner", () => {
    const reel = buildReel(names, "Charlie");
    expect(reel.at(-1)?.name).toBe("Charlie");
  });
  it("takes about 1.5 seconds and slows down", () => {
    const reel = buildReel(names, "Charlie");
    const total = reel.reduce((s, f) => s + f.delayMs, 0);
    expect(total).toBeGreaterThan(1300);
    expect(total).toBeLessThan(1700);
    expect(reel[0].delayMs).toBeLessThan(reel.at(-1)!.delayMs);
  });
  it("works with only one restaurant", () => {
    expect(buildReel(["Solo"], "Solo").every((f) => f.name === "Solo")).toBe(true);
  });
});

describe("formatDistance", () => {
  it("uses miles in the US", () => {
    expect(formatDistance(50, "US")).toBe("< 0.1 mi");
    expect(formatDistance(1931, "US")).toBe("1.2 mi");
    expect(formatDistance(32187, "US")).toBe("20 mi");
  });
  it("uses metres/kilometres in Canada", () => {
    expect(formatDistance(847, "CA")).toBe("850 m");
    expect(formatDistance(3240, "CA")).toBe("3.2 km");
    expect(formatDistance(25400, "CA")).toBe("25 km");
  });
});

describe("directionsUrl", () => {
  it("builds a Google Maps directions link", () => {
    expect(directionsUrl({ lat: 34.08, lon: -118.41 })).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=34.08%2C-118.41",
    );
  });
});

describe("formatHours", () => {
  it("makes OpenStreetMap hours readable", () => {
    expect(formatHours("Mo-Fr 11:00-22:00; Sa,Su 12:00-23:00")).toEqual([
      "Mon–Fri 11:00–22:00",
      "Sat, Sun 12:00–23:00",
    ]);
  });
  it("handles closed days", () => {
    expect(formatHours("Mo off; Tu-Su 17:00-22:00")).toEqual(["Mon closed", "Tue–Sun 17:00–22:00"]);
  });
});

describe("displayHost / telHref", () => {
  it("shortens websites", () => {
    expect(displayHost("https://www.luigis.example/menu")).toBe("luigis.example");
  });
  it("cleans phone numbers for tel: links", () => {
    expect(telHref("+1 (310) 555-0100")).toBe("tel:+13105550100");
  });
});
