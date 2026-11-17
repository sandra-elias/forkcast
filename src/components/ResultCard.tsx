"use client";

import { useEffect, useRef } from "react";
import type { RestaurantWithStatus } from "@/lib/places";
import type { Country } from "@/lib/postalCode";
import { directionsUrl, displayHost, formatDistance, formatHours, telHref } from "@/lib/spin";

type Props = {
  restaurant: RestaurantWithStatus;
  country: Country;
  onSpinAgain: () => void;
};

// No label for "unknown": most OpenStreetMap places have no hours, so we just don't mention it.
const STATUS_TEXT = { open: "Open now", closed: "Closed now" } as const;

export default function ResultCard({ restaurant: r, country, onSpinAgain }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move keyboard/screen-reader focus to the result so it's announced,
  // and scroll it into view on phones.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    headingRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }, [r.id]);

  return (
    <article className="animate-pop rounded-2xl border-2 border-zinc-300 p-5 dark:border-zinc-700">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Tonight you&apos;re eating at</p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-1 font-display text-3xl font-medium tracking-tight break-words focus:outline-none"
      >
        {r.name}
      </h2>

      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-zinc-600 dark:text-zinc-300">
        <span>{r.cuisine}</span>
        <span aria-hidden="true">·</span>
        <span>{formatDistance(r.distanceMeters, country)} away</span>
        {r.openStatus !== "unknown" && (
          <>
            <span aria-hidden="true">·</span>
            <span
              className={
                r.openStatus === "open" ? "font-medium text-foreground" : "text-red-600 dark:text-red-400"
              }
            >
              {STATUS_TEXT[r.openStatus]}
            </span>
          </>
        )}
      </p>

      <dl className="mt-4 space-y-3 text-sm">
        {r.address && (
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Address</dt>
            <dd>{r.address}</dd>
          </div>
        )}
        {r.hours && (
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Hours</dt>
            <dd>
              {formatHours(r.hours).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </dd>
          </div>
        )}
        {r.phone && (
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Phone</dt>
            <dd>
              <a href={telHref(r.phone)} className="underline underline-offset-4 hover:text-zinc-500 dark:hover:text-zinc-400">
                {r.phone}
              </a>
            </dd>
          </div>
        )}
        {r.website && (
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Website</dt>
            <dd>
              <a
                href={r.website}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all underline underline-offset-4 hover:text-zinc-500 dark:hover:text-zinc-400"
              >
                {displayHost(r.website)}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-5 flex flex-col gap-3">
        <a
          href={directionsUrl(r)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 items-center justify-center rounded-2xl bg-button text-lg font-semibold text-background transition hover:bg-button/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/30 active:scale-[0.98]"
        >
          Get directions
          <span className="sr-only"> (opens Google Maps in a new tab)</span>
        </a>
        <button
          type="button"
          onClick={onSpinAgain}
          className="h-14 rounded-2xl border-2 border-zinc-300 text-lg font-semibold transition hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/30 active:scale-[0.98] dark:border-zinc-700"
        >
          Spin again
        </button>
      </div>
    </article>
  );
}
