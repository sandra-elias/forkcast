"use client";

import { useEffect, useState } from "react";
import { buildReel } from "@/lib/spin";

type Props = {
  names: string[];
  winner: string;
  onDone: () => void;
};

/** Flashes restaurant names for ~1.5 s, slowing down, then lands on the winner. */
export default function SpinReel({ names, winner, onDone }: Props) {
  const [frames] = useState(() => buildReel(names, winner));
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const frame = frames[index];
    const timer = setTimeout(() => {
      if (index < frames.length - 1) setIndex(index + 1);
      else onDone();
    }, frame.delayMs);
    return () => clearTimeout(timer);
  }, [index, frames, onDone]);

  return (
    <div className="flex h-40 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-zinc-300 px-4 text-center dark:border-zinc-700">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Spinning…</p>
      {/* aria-hidden: screen readers hear only the final result, not every flashing name */}
      <p
        key={index}
        aria-hidden="true"
        className="animate-reel mt-2 line-clamp-2 font-display text-2xl font-medium tracking-tight"
      >
        {frames[index].name}
      </p>
    </div>
  );
}
