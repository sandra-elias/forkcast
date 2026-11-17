import { describe, expect, it } from "vitest";
import { EMPTY_MESSAGE, UNSUPPORTED_MESSAGE, parsePostalCode } from "./postalCode";

describe("parsePostalCode", () => {
  describe("US ZIP codes", () => {
    it.each([
      ["90210", "90210"],
      ["  10001  ", "10001"], // extra spaces are ignored
      ["02134", "02134"], // leading zero is kept
      ["90210-1234", "90210"], // ZIP+4 with hyphen
      ["90210 1234", "90210"], // ZIP+4 with space
      ["902101234", "90210"], // ZIP+4 run together
    ])("accepts %j as US %s", (input, code) => {
      expect(parsePostalCode(input)).toEqual({ ok: true, country: "US", code });
    });
  });

  describe("Canadian postal codes", () => {
    it.each([
      ["K1A 0B1", "K1A 0B1"],
      ["k1a0b1", "K1A 0B1"], // lowercase, no space
      ["M5V 3L9", "M5V 3L9"],
      ["  h2x 1y4 ", "H2X 1Y4"],
    ])("accepts %j as CA %s", (input, code) => {
      expect(parsePostalCode(input)).toEqual({ ok: true, country: "CA", code });
    });
  });

  describe("unsupported input", () => {
    it.each([
      "1234", // too short
      "123456", // 6 digits
      "90210-12", // broken ZIP+4
      "SW1A 1AA", // UK postcode
    ])("rejects %j", (input) => {
      expect(parsePostalCode(input)).toEqual({ ok: false, error: UNSUPPORTED_MESSAGE });
    });

    it.each([
      "D1A 0B1", // D is never used
      "W1A 0B1", // W never starts a postal code
      "K1A 0O1", // O is never used
      "K1A  0B1", // two spaces
      "K1A-0B1", // hyphen isn't a Canadian format
      "hello",
      "1A1 A1A",
    ])("rejects invalid Canadian-looking %j", (input) => {
      expect(parsePostalCode(input)).toEqual({ ok: false, error: UNSUPPORTED_MESSAGE });
    });

    it("asks for input when empty", () => {
      expect(parsePostalCode("   ")).toEqual({ ok: false, error: EMPTY_MESSAGE });
    });
  });
});
