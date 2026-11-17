"use client";

import { useId, useState } from "react";
import { CUISINES, type CuisineId } from "@/lib/search";

type Props = {
  openNow: boolean;
  onOpenNowChange: (value: boolean) => void;
  excluded: CuisineId[];
  onExcludedChange: (value: CuisineId[]) => void;
};

/** Collapsible "Filters" section: open-now switch + cuisines to exclude. */
export default function Filters({ openNow, onOpenNowChange, excluded, onExcludedChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const summary = [openNow ? "Open now" : null, excluded.length ? `${excluded.length} excluded` : null]
    .filter(Boolean)
    .join(" · ");

  function toggleCuisine(id: CuisineId) {
    onExcludedChange(excluded.includes(id) ? excluded.filter((c) => c !== id) : [...excluded, id]);
  }

  return (
    <section className="rounded-2xl border-2 border-zinc-300 dark:border-zinc-700">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/30"
      >
        <span className="font-semibold">Filters</span>
        <span className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          {summary || "None"}
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      <div id={panelId} hidden={!expanded} className="space-y-5 border-t border-zinc-300 px-4 py-4 dark:border-zinc-700">
        {/* Open now switch */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p id={`${panelId}-open`} className="font-medium">
              Open now
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Skip places listed as closed</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={openNow}
            aria-labelledby={`${panelId}-open`}
            onClick={() => onOpenNowChange(!openNow)}
            className={`relative h-8 w-14 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/30 ${
              openNow ? "bg-button" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-background shadow transition-transform ${
                openNow ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        {/* Exclude cuisines */}
        <fieldset>
          <legend className="font-medium">Exclude cuisines</legend>
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">Tap anything you&apos;re not in the mood for</p>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => {
              const isExcluded = excluded.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={isExcluded}
                  onClick={() => toggleCuisine(c.id)}
                  className={`rounded-full border-2 px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/30 ${
                    isExcluded
                      ? "border-foreground text-zinc-500 line-through dark:text-zinc-400"
                      : "border-zinc-300 hover:bg-foreground/5 dark:border-zinc-700"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          {excluded.length > 0 && (
            <button
              type="button"
              onClick={() => onExcludedChange([])}
              className="mt-3 text-sm underline underline-offset-4 hover:text-zinc-500 dark:hover:text-zinc-400"
            >
              Clear all
            </button>
          )}
        </fieldset>
      </div>
    </section>
  );
}
