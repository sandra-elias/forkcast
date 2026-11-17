"use client";

import { useState } from "react";
import { parsePostalCode } from "@/lib/postalCode";

type Status =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "locating" }
  // Temporary "success" states for Stage 2. Later stages replace these with
  // a real geocoding lookup and a jump to the map screen.
  | { kind: "code-ok"; message: string }
  | { kind: "coords-ok"; message: string };

const PERMISSION_DENIED_MESSAGE =
  "No problem! Location access is off, so please enter your zip or postal code instead.";

export default function LocationForm() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = parsePostalCode(code);
    if (!result.ok) {
      setStatus({ kind: "error", message: result.error });
      return;
    }
    const label = result.country === "US" ? "US ZIP code" : "Canadian postal code";
    setStatus({ kind: "code-ok", message: `Got it: ${label} ${result.code}.` });
  }

  function handleUseLocation() {
    if (!("geolocation" in navigator)) {
      setStatus({
        kind: "error",
        message: "Your browser can't share your location. Please enter your zip or postal code instead.",
      });
      return;
    }
    setStatus({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setStatus({
          kind: "coords-ok",
          message: `Found you at ${latitude.toFixed(3)}, ${longitude.toFixed(3)}.`,
        });
      },
      (err) => {
        setStatus({
          kind: "error",
          message:
            err.code === err.PERMISSION_DENIED
              ? PERMISSION_DENIED_MESSAGE
              : "We couldn't find your location. Please enter your zip or postal code instead.",
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }

  const isError = status.kind === "error";
  const isLocating = status.kind === "locating";

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <label htmlFor="postal-code" className="sr-only">
          Enter zip or postal code
        </label>
        <input
          id="postal-code"
          name="postal-code"
          type="text"
          inputMode="text"
          autoComplete="postal-code"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Enter zip or postal code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (isError) setStatus({ kind: "idle" }); // clear old error while typing
          }}
          aria-invalid={isError}
          aria-describedby="location-status"
          className="h-14 w-full rounded-2xl border-2 border-zinc-300 bg-white px-4 text-center text-lg text-zinc-900 placeholder:text-zinc-500 focus:border-foreground focus:outline-none focus:ring-4 focus:ring-foreground/15 aria-[invalid=true]:border-red-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400"
        />
        <button
          type="submit"
          className="h-14 w-full rounded-2xl bg-button text-lg font-semibold text-background transition hover:bg-button/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/30 active:scale-[0.98]"
        >
          Let&apos;s eat
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400" aria-hidden="true">
        <span className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
        or
        <span className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
      </div>

      <button
        type="button"
        onClick={handleUseLocation}
        disabled={isLocating}
        className="flex h-14 w-full items-center justify-center rounded-2xl border-2 border-zinc-300 text-lg font-semibold transition hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/30 disabled:cursor-wait disabled:opacity-60 active:scale-[0.98] dark:border-zinc-700"
      >
        {isLocating ? "Finding you…" : "Use my location"}
      </button>

      {/* aria-live makes screen readers announce errors and updates. */}
      <p
        id="location-status"
        role="status"
        aria-live="polite"
        className={`mt-4 min-h-12 text-center text-base ${
          isError ? "font-medium text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-300"
        }`}
      >
        {"message" in status ? status.message : ""}
      </p>
    </div>
  );
}
