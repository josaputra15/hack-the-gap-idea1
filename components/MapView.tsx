"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import { COUNTRIES, COUNTRY_INDEX, PLACE_INDEX, EMOJI, flagSrc } from "@/lib/data";
import { useNav, useUser } from "@/lib/store";
import { mapRef } from "@/lib/mapRef";

const LOCAL_ZOOM = 4.2; // above this zoom, flags give way to local story circles
const STYLE_URLS = ["https://tiles.openfreemap.org/styles/positron", "https://tiles.openfreemap.org/styles/liberty"];

const FALLBACK: StyleSpecification = {
  version: 8,
  sources: { countries: { type: "geojson", data: "/countries.geojson" } },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#d5e5f6" } },
    { id: "land", type: "fill", source: "countries", paint: { "fill-color": "#ffffff" } },
    { id: "borders", type: "line", source: "countries", paint: { "line-color": "#c9d2e1", "line-width": 0.8 } },
  ],
};

async function pickStyle(): Promise<string | StyleSpecification> {
  for (const url of STYLE_URLS) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (r.ok) return url;
    } catch {}
  }
  return FALLBACK;
}

export default function MapView({ onLevel }: { onLevel: (l: "world" | "local") => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState<"world" | "local">("world");
  const nav = useNav();
  const seen = useUser((s) => s.seen);
  const flagEls = useRef(new Map<string, HTMLButtonElement>());
  const localEls = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    let cancelled = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let spinning = !reduced;

    pickStyle().then((style) => {
      if (cancelled || !box.current) return;
      const map = new maplibregl.Map({
        container: box.current,
        style,
        center: [15, 24],
        zoom: innerWidth < 720 ? 0.9 : 1.7,
        minZoom: 0.6,
        maxZoom: 17,
        attributionControl: { compact: true },
        renderWorldCopies: false,
      });
      mapRef.current = map;

      map.on("style.load", () => {
        try { map.setProjection({ type: "globe" }); } catch {}
        try {
          map.setSky({
            "sky-color": "#eaf2fc", "horizon-color": "#ffffff", "fog-color": "#f5f7fb",
            "sky-horizon-blend": 0.5, "horizon-fog-blend": 0.6, "fog-ground-blend": 0.5,
            "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 5, 1, 7, 0],
          });
        } catch {}
        const st = map.getStyle();
        if (st.sources.openmaptiles && !st.layers.some((l) => l.type === "fill-extrusion")) {
          try {
            map.addLayer({
              id: "pw-buildings", type: "fill-extrusion", source: "openmaptiles", "source-layer": "building", minzoom: 14,
              paint: {
                "fill-extrusion-color": "#e6ebf3",
                "fill-extrusion-height": ["coalesce", ["get", "render_height"], 10],
                "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
                "fill-extrusion-opacity": 0.9,
              },
            });
          } catch {}
        }
        map.addSource("pw-heat", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: COUNTRIES.flatMap((c) => c.places.map((p) => ({
              type: "Feature" as const, properties: { w: p.stories.length }, geometry: { type: "Point" as const, coordinates: p.at },
            }))),
          },
        });
        map.addLayer({
          id: "pw-heat", type: "heatmap", source: "pw-heat", minzoom: 2.5, maxzoom: 12,
          paint: {
            "heatmap-weight": ["/", ["get", "w"], 2],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 30, 9, 90],
            "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 2.5, 0, 4, 0.6, 11, 0.3, 12, 0],
            "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(255,255,255,0)", 0.3, "rgba(255,226,92,0.45)", 0.7, "rgba(255,138,61,0.55)", 1, "rgba(255,61,127,0.6)"],
          },
        });
      });

      // markers
      COUNTRIES.forEach((c, i) => {
        const el = document.createElement("button");
        el.className = "pw-flag";
        el.style.setProperty("--d", `${0.2 + i * 0.04}s`);
        el.setAttribute("aria-label", `${c.name}: ${c.stories.length} stories`);
        el.innerHTML = `<span style="position:relative"><span class="b"><img src="${flagSrc(c.code)}" alt=""/></span><span class="n" aria-hidden="true">${c.stories.length}</span><span class="name" aria-hidden="true">${c.name}</span></span><span class="stem" aria-hidden="true"></span><span class="dot" aria-hidden="true"></span>`;
        el.addEventListener("click", (e) => { e.stopPropagation(); useNav.getState().go({ country: c.code, full: false, story: null, place: null }); });
        flagEls.current.set(c.code, el);
        new maplibregl.Marker({ element: el, anchor: "bottom", opacityWhenCovered: "0" }).setLngLat(c.center).addTo(map);
      });
      COUNTRIES.forEach((c) => c.places.forEach((p, i) => {
        const el = document.createElement("button");
        el.className = "pw-local";
        el.style.setProperty("--d", `${i * 0.06}s`);
        el.setAttribute("aria-label", `${p.name}: ${p.stories.length} local stories. Play.`);
        el.innerHTML = `<span class="ring" aria-hidden="true"><span class="in">${EMOJI[p.stories[0].category] ?? "📰"}</span></span><span class="lbl" aria-hidden="true">${p.name}</span>`;
        el.addEventListener("click", (e) => { e.stopPropagation(); useNav.getState().go({ country: c.code, place: p.id }); });
        localEls.current.set(p.id, el);
        new maplibregl.Marker({ element: el, anchor: "center", opacityWhenCovered: "0" }).setLngLat(p.at).addTo(map);
      }));

      const updateLevel = () => {
        const l = map.getZoom() >= LOCAL_ZOOM ? "local" : "world";
        setLevel((prev) => (prev === l ? prev : l));
      };
      map.on("zoom", updateLevel);

      const stop = () => { spinning = false; };
      ["mousedown", "touchstart", "wheel", "dragstart"].forEach((e) => map.on(e as "mousedown", stop));
      box.current.addEventListener("keydown", stop);
      const step = () => {
        if (!spinning) return;
        const ctr = map.getCenter();
        map.easeTo({ center: [ctr.lng + 6, ctr.lat], duration: 1600, easing: (t) => t });
      };
      map.on("moveend", step);
      map.on("load", () => {
        const n = useNav.getState();
        if (n.country || n.place) spinning = false;
        else step();
      });
      useNav.subscribe(() => { spinning = false; });
    });

    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // keyboard reachability + parent notification
  useEffect(() => {
    flagEls.current.forEach((el) => (el.tabIndex = level === "world" ? 0 : -1));
    localEls.current.forEach((el) => (el.tabIndex = level === "local" ? 0 : -1));
    onLevel(level);
  }, [level, onLevel]);

  useEffect(() => {
    localEls.current.forEach((el, id) => el.classList.toggle("seen", seen.includes(id)));
  }, [seen, level]);

  // fly when the selection changes
  useEffect(() => {
    flagEls.current.forEach((el, code) => el.classList.toggle("active", code === nav.country));
    const map = mapRef.current;
    if (!map) return;
    const mobile = innerWidth < 720;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (nav.place) {
      const p = PLACE_INDEX.get(nav.place);
      if (p) map.flyTo({ center: p.at, zoom: 10.5, pitch: 55, bearing: -12, padding: 0, duration: reduced ? 0 : 2200, essential: true });
    } else if (nav.country && !nav.full) {
      const c = COUNTRY_INDEX.get(nav.country);
      if (c) map.flyTo({
        center: c.center, zoom: mobile ? 2.8 : 3.4, pitch: 0, bearing: 0,
        padding: mobile ? { top: 40, bottom: innerHeight * 0.5, left: 0, right: 0 } : { top: 40, bottom: 40, left: 0, right: 480 },
        duration: reduced ? 0 : 2000, essential: true,
      });
    }
  }, [nav.country, nav.place, nav.full]);

  return (
    <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_50%_40%,#ffffff_0%,var(--paper)_70%)]">
      <div
        ref={box}
        data-level={level}
        className="h-full w-full"
        role="region"
        aria-label="World map. Use Tab to move between country flags; zoom in for local stories."
      />
    </div>
  );
}
