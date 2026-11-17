"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useId, useState } from "react";
import type { ResolvedLocation } from "@/lib/geocode";
import type { RestaurantWithStatus } from "@/lib/places";
import { getRestaurants } from "@/lib/restaurantsClient";
import { forgetSeen, loadSeen, markSeen } from "@/lib/seenStore";
import { pickUnseen } from "@/lib/spin";
import ResultCard from "./ResultCard";
import SpinReel from "./SpinReel";
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

/** What the bottom of the panel is showing right now. */
type Phase =
  | { kind: "idle" }
  | { kind: "searching" }
  | { kind: "spinning"; winner: RestaurantWithStatus; names: string[] }
  | { kind: "result"; winner: RestaurantWithStatus }
  | { kind: "message"; text: string; resetIds?: string[] };

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const sliderId = useId();

  const radiusMeters = radiusToMeters(radius, location.country);

  async function handleSpin() {
    setPhase({ kind: "searching" });
    try {
      // Cached after the first call, so "spin again" is instant.
      const restaurants = await getRestaurants({ location, radiusMeters, openNow, excluded });
      if (restaurants.length === 0) {
        setPhase({ kind: "message", text: EMPTY_MESSAGE });
        return;
      }

      const winner = pickUnseen(restaurants, loadSeen());
      if (!winner) {
        setPhase({
          kind: "message",
          text: `You've seen all ${restaurants.length} matching restaurant${restaurants.length === 1 ? "" : "s"}. Try a bigger radius or different filters.`,
          resetIds: restaurants.map((r) => r.id),
        });
        return;
      }
      markSeen(winner.id); // no repeats this session

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion || restaurants.length === 1) {
        setPhase({ kind: "result", winner });
      } else {
        const names = shuffle(restaurants.map((r) => r.name)).slice(0, 40);
        setPhase({ kind: "spinning", winner, names });
      }
    } catch (err) {
      setPhase({ kind: "message", text: (err as Error).message });
    }
  }

  function handleStartOver(ids: string[]) {
    forgetSeen(ids);
    handleSpin();
  }

  // Stable function so the reel's timer isn't restarted on every render.
  const finishSpin = useCallback(() => {
    setPhase((p) => (p.kind === "spinning" ? { kind: "result", winner: p.winner } : p));
  }, []);

  const pick = phase.kind === "result" ? phase.winner : null;

  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      {/* Map: top on phones, left side on big screens */}
      <div
        className="relative h-[45vh] min-h-64 w-full lg:sticky lg:top-0 lg:h-screen lg:flex-1"
        role="region"
        aria-label={`Map of a ${radius} ${radiusConfig.unitLabel} radius around ${location.label}`}
      >
        <RadiusMap lat={location.lat} lon={location.lon} radiusMeters={radiusMeters} pick={pick} />
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

        {phase.kind === "spinning" ? (
          <SpinReel names={phase.names} winner={phase.winner.name} onDone={finishSpin} />
        ) : phase.kind === "result" ? (
          <ResultCard restaurant={phase.winner} country={location.country} onSpinAgain={handleSpin} />
        ) : (
          /* Sticky on phones so SPIN is always reachable */
          <div className="sticky bottom-0 -mx-4 mt-auto bg-background/90 px-4 pt-2 pb-4 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
            <button
              type="button"
              onClick={handleSpin}
              disabled={phase.kind === "searching"}
              className="h-16 w-full rounded-2xl bg-button font-display text-2xl font-medium tracking-wide text-background transition hover:bg-button/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/30 disabled:cursor-wait disabled:opacity-60 active:scale-[0.98]"
            >
              {phase.kind === "searching" ? "Finding restaurants…" : "SPIN"}
            </button>
            <div role="status" aria-live="polite" className="mt-2 min-h-5 text-center text-sm text-zinc-600 dark:text-zinc-400">
              {phase.kind === "message" && (
                <>
                  <p>{phase.text}</p>
                  {phase.resetIds && (
                    <button
                      type="button"
                      onClick={() => handleStartOver(phase.resetIds!)}
                      className="mt-1 font-medium text-foreground underline underline-offset-4"
                    >
                      Start over with these
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
