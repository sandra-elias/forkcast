import { Suspense } from "react";
import MapScreen from "@/components/MapScreen";

// MapScreen reads the location from the URL (?lat=..&lon=..), which only exists in the
// browser at request time, so it sits inside <Suspense> with a simple loading fallback.
export default function MapPage() {
  return (
    <Suspense fallback={<div className="flex-1 animate-pulse bg-zinc-100 dark:bg-zinc-900" />}>
      <MapScreen />
    </Suspense>
  );
}
