"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import type { ResolvedLocation } from "@/lib/geocode";
import { getRestaurants } from "@/lib/restaurantsClient";
import {
  type CuisineId,
  EMPTY_MESSAGE,
  RADIUS,
  locationFromSearchParams,
  radiusToMeters,
} from "@/lib/search";
import Filters from "./Filters";

// Load the map only in the browser (Leaflet can't run on the server).
const RadiusMap = dynamic(() => import("./RadiusMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-zinc-200 dark:bg-zinc-800" />,
});

export default function MapScreen() {
  const location = locationFromSearchParams(useSearchParams());

  if (!location) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg">We lost track of your location.</p>
        <Link href="/" className="font-semibold underline underline-offset-4">
          Start over
        </Link>
      </main>
    );
  }
  // `key` resets all settings if the location changes.
  return <MapScreenInner key={`${location.lat},${location.lon}`} location={location} />;
}

function MapScreenInner({ location }: { location: ResolvedLocation }) {
  const radiusConfig = RADIUS[location.country];
  const [radius, setRadius] = useState(radiusConfig.default);
  const [openNow, setOpenNow] = useState(true);
  const [excluded, setExcluded] = useState<CuisineId[]>([]);
  const [note, setNote] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const sliderId = useId();

  const radiusMeters = radiusToMeters(radius, location.country);

  async function handleSpin() {
    setIsSearching(true);
    setNote("");
    try {
      const restaurants = await getRestaurants({ location, radiusMeters, openNow, excluded });
      // Temporary for Stage 5: show what we found. Stage 6 adds the spin + result card.
      setNote(
        restaurants.length === 0
          ? EMPTY_MESSAGE
          : `${restaurants.length} restaurant${restaurants.length === 1 ? "" : "s"} to spin from. The spin itself arrives in Stage 6.`,
      );
    } catch (err) {
      setNote((err as Error).message);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      {/* Map: top on phones, left side on big screens */}
      <div
        className="relative h-[45vh] min-h-64 w-full lg:sticky lg:top-0 lg:h-screen lg:flex-1"
        role="region"
        aria-label={`Map of a ${radius} ${radiusConfig.unitLabel} radius around ${location.label}`}
      >
        <RadiusMap lat={location.lat} lon={location.lon} radiusMeters={radiusMeters} />
        {/* Logo badge floating over the map. z-index sits above Leaflet's layers (max 1000). */}
        <Link
          href="/"
          aria-label="Forkcast home"
          className="absolute top-3 left-4 z-[1001] rounded-md font-display text-2xl font-medium tracking-tight [text-shadow:0_0_8px_var(--background),0_0_2px_var(--background)] transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/30"
        >
          Forkcast
        </Link>
      </div>

      {/* Controls */}
      <div className="flex w-full flex-col gap-6 px-4 pt-6 pb-4 lg:w-[400px] lg:overflow-y-auto lg:px-6 lg:pt-8">
        <div>
          <Link
            href="/"
            className="text-sm text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            ← Change location
          </Link>
          <h1 className="mt-4">
            <span className="block text-sm text-zinc-500 dark:text-zinc-400">Restaurants near</span>
            <span className="mt-1 block font-display text-2xl font-medium tracking-tight">{location.label}</span>
          </h1>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor={sliderId} className="font-semibold">
              Search radius
            </label>
            <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
              {radius} {radiusConfig.unit}
            </span>
          </div>
          <input
            id={sliderId}
            type="range"
            min={radiusConfig.min}
            max={radiusConfig.max}
            step={1}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            aria-valuetext={`${radius} ${radiusConfig.unitLabel}`}
            className="h-2 w-full cursor-pointer accent-foreground"
          />
          <div className="mt-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400" aria-hidden="true">
            <span>
              {radiusConfig.min} {radiusConfig.unit}
            </span>
            <span>
              {radiusConfig.max} {radiusConfig.unit}
            </span>
          </div>
        </div>

        <Filters
          openNow={openNow}
          onOpenNowChange={setOpenNow}
          excluded={excluded}
          onExcludedChange={setExcluded}
        />

        {/* Sticky on phones so SPIN is always reachable */}
        <div className="sticky bottom-0 -mx-4 mt-auto bg-background/90 px-4 pt-2 pb-4 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
          <button
            type="button"
            onClick={handleSpin}
            disabled={isSearching}
            className="h-16 w-full rounded-2xl bg-button font-display text-2xl font-medium tracking-wide text-background transition hover:bg-button/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/30 disabled:cursor-wait disabled:opacity-60 active:scale-[0.98]"
          >
            {isSearching ? "Finding restaurants…" : "SPIN"}
          </button>
          <p role="status" aria-live="polite" className="mt-2 min-h-5 text-center text-sm text-zinc-600 dark:text-zinc-400">
            {note}
          </p>
        </div>
      </div>
    </main>
  );
}
