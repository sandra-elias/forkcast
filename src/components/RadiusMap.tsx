"use client";

// The actual Leaflet map. Leaflet only works in a browser (it needs `window`),
// so MapScreen loads this file with `ssr: false`.
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useSyncExternalStore } from "react";
import {
  AttributionControl,
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
  ZoomControl,
} from "react-leaflet";

// Geoapify requires this credit on the map, alongside OpenMapTiles and OpenStreetMap.
const ATTRIBUTION =
  'Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noopener">Geoapify</a> · ' +
  '<a href="https://openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> · ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a>';

// Leaflet's default prefix includes a flag icon; use a plain text link instead.
const LEAFLET_PREFIX = '<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>';

// Follows the computer's light/dark setting, live.
function subscribeToColorScheme(callback: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function useIsDarkMode() {
  return useSyncExternalStore(
    subscribeToColorScheme,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
}

/** Zooms the map so the whole radius circle fits whenever the radius changes. */
function FitToRadius({ lat, lon, radiusMeters }: { lat: number; lon: number; radiusMeters: number }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(L.latLng(lat, lon).toBounds(radiusMeters * 2), { padding: [12, 12] });
  }, [map, lat, lon, radiusMeters]);
  return null;
}

type Props = {
  lat: number;
  lon: number;
  radiusMeters: number;
  /** The restaurant the spin landed on, shown as a pin with its name. */
  pick?: { lat: number; lon: number; name: string } | null;
};

export default function RadiusMap({ lat, lon, radiusMeters, pick }: Props) {
  const isDark = useIsDarkMode();
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_MAP_KEY;

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Map unavailable: NEXT_PUBLIC_GEOAPIFY_MAP_KEY is missing from .env.local.
      </div>
    );
  }

  const style = isDark ? "dark-matter" : "positron";
  const ink = isDark ? "#ededed" : "#171717";

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={12}
      attributionControl={false} // replaced by the custom one below
      zoomControl={false} // moved to the top-right; the Forkcast logo sits top-left
      className="h-full w-full"
    >
      <ZoomControl position="topright" />
      <AttributionControl position="bottomright" prefix={LEAFLET_PREFIX} />
      <TileLayer
        key={style}
        url={`https://maps.geoapify.com/v1/tile/${style}/{z}/{x}/{y}{r}.png?apiKey=${apiKey}`}
        attribution={ATTRIBUTION}
        maxZoom={20}
      />
      <Circle
        center={[lat, lon]}
        radius={radiusMeters}
        pathOptions={{ color: ink, weight: 2, fillColor: ink, fillOpacity: 0.06 }}
      />
      <CircleMarker
        center={[lat, lon]}
        radius={7}
        pathOptions={{ color: isDark ? "#0a0a0a" : "#ffffff", weight: 3, fillColor: ink, fillOpacity: 1 }}
      />
      {pick && (
        <CircleMarker
          key={`${pick.lat},${pick.lon}`}
          center={[pick.lat, pick.lon]}
          radius={10}
          pathOptions={{ color: ink, weight: 3, fillColor: isDark ? "#0a0a0a" : "#ffffff", fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]} className="forkcast-tooltip">
            {pick.name}
          </Tooltip>
        </CircleMarker>
      )}
      <FitToRadius lat={lat} lon={lon} radiusMeters={radiusMeters} />
    </MapContainer>
  );
}
