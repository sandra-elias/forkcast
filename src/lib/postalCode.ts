// Figures out whether a user's input is a US ZIP code or a Canadian postal code.
// Pure function (no React, no network) so it's easy to test with Vitest.

export type Country = "US" | "CA";

export type PostalCodeResult =
  | { ok: true; country: Country; code: string } // `code` is the cleaned-up version
  | { ok: false; error: string };

export const UNSUPPORTED_MESSAGE =
  "Sorry, we only support US zip codes and Canadian postal codes right now.";

export const EMPTY_MESSAGE = "Please enter a zip or postal code.";

// US: 5 digits, optionally followed by ZIP+4 ("12345-6789", "12345 6789" or "123456789").
const US_ZIP = /^(\d{5})(?:[-\s]?\d{4})?$/;

// Canada: Letter-Digit-Letter Digit-Letter-Digit, e.g. "K1A 0B1".
// Canada Post never uses D, F, I, O, Q, U; W and Z are also never the first letter.
const CA_POSTAL = /^([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z])\s?(\d[ABCEGHJ-NPRSTV-Z]\d)$/;

export function parsePostalCode(input: string): PostalCodeResult {
  const trimmed = input.trim();
  if (trimmed === "") return { ok: false, error: EMPTY_MESSAGE };

  const us = trimmed.match(US_ZIP);
  if (us) return { ok: true, country: "US", code: us[1] };

  const ca = trimmed.toUpperCase().match(CA_POSTAL);
  if (ca) return { ok: true, country: "CA", code: `${ca[1]} ${ca[2]}` };

  return { ok: false, error: UNSUPPORTED_MESSAGE };
}
