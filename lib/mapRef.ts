import type { Map } from "maplibre-gl";

/** Shared handle to the map so other components can zoom or fly it. */
export const mapRef: { current: Map | null } = { current: null };

export function flyHome() {
  const m = mapRef.current;
  if (!m) return;
  m.flyTo({ center: [15, 24], zoom: innerWidth < 720 ? 0.9 : 1.7, pitch: 0, bearing: 0, padding: 0, duration: 1600 });
}
