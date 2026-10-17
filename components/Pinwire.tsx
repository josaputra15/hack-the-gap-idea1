"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, Minus, Globe2, LayoutGrid, X } from "lucide-react";
import { COUNTRIES } from "@/lib/data";
import { useNav, useUser, navToSearch, searchToNav, type Nav } from "@/lib/store";
import { mapRef, flyHome } from "@/lib/mapRef";
import CountryPanel from "./CountryPanel";
import StoryModal from "./StoryModal";
import StoryViewer from "./StoryViewer";
import Toaster from "./Toast";
import { Flag } from "./bits";
import { useDialog } from "./useDialog";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

/* Keep nav state and the URL in step, so Back / Forward and shared links work.
   Closing a layer steps back in history instead of adding a new entry. */
function useUrlSync() {
  useEffect(() => {
    const urlOf = () => location.search || location.pathname;
    let entries = [urlOf()];
    let idx = 0;
    let syncing = false;
    history.replaceState({ i: 0 }, "");
    syncing = true;
    useNav.getState().replace(searchToNav(location.search));
    syncing = false;

    const onPop = (e: PopStateEvent) => {
      idx = typeof e.state?.i === "number" ? e.state.i : 0;
      if (!entries[idx]) entries[idx] = urlOf();
      syncing = true;
      useNav.getState().replace(searchToNav(location.search));
      syncing = false;
    };
    addEventListener("popstate", onPop);
    const unsub = useNav.subscribe((n: Nav) => {
      if (syncing) return;
      const url = navToSearch(n);
      if (url === entries[idx]) return;
      if (idx > 0 && entries[idx - 1] === url) { history.back(); return; }
      entries = [...entries.slice(0, idx + 1), url];
      idx++;
      history.pushState({ i: idx }, "", url);
    });
    return () => { removeEventListener("popstate", onPop); unsub(); };
  }, []);
}

export default function Pinwire() {
  useUrlSync();
  const [level, setLevel] = useState<"world" | "local">("world");
  const [grid, setGrid] = useState(false);
  const nav = useNav();
  const onLevel = useCallback((l: "world" | "local") => setLevel(l), []);

  return (
    <>
      <a href="#all-countries" onClick={(e) => { e.preventDefault(); setGrid(true); }} className="fixed left-3 -top-20 z-[100] rounded-xl bg-ink px-4 py-2.5 font-semibold text-white focus:top-3">
        Skip to the list of countries
      </a>
      <h1 className="sr-only">Pinwire: world news on a map, in plain English</h1>

      <MapView onLevel={onLevel} />

      <TopBar onGrid={() => setGrid(true)} />

      {/* Map controls */}
      <div className={`fixed right-4 z-20 flex flex-col gap-1 rounded-2xl border border-line bg-surface/90 p-1 shadow-[var(--shadow-sm)] backdrop-blur transition-opacity bottom-28 md:top-1/2 md:bottom-auto md:-translate-y-1/2 ${nav.country && !nav.full ? "max-md:opacity-0 md:right-[472px]" : ""}`} role="group" aria-label="Map controls">
        <button aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} className="grid size-11 place-items-center rounded-xl hover:bg-ink/5"><Plus className="size-5" aria-hidden="true" /></button>
        <button aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} className="grid size-11 place-items-center rounded-xl hover:bg-ink/5"><Minus className="size-5" aria-hidden="true" /></button>
        <button aria-label="Show the whole world" onClick={flyHome} className="grid size-11 place-items-center rounded-xl hover:bg-ink/5"><Globe2 className="size-5" aria-hidden="true" /></button>
      </div>

      {/* Hint */}
      <AnimatePresence mode="wait">
        {!nav.country && (
          <motion.p
            key={level}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-14 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-surface/95 px-4 py-2.5 text-sm font-medium shadow-[var(--shadow-sm)] backdrop-blur"
            aria-live="polite"
          >
            {level === "world" ? "Tap a flag to read a country's news. Zoom in for local stories." : "Local stories. Tap a circle to watch."}
          </motion.p>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-3 rounded-full bg-surface/80 px-3 py-1 text-xs text-muted backdrop-blur md:left-4 md:translate-x-0">
        <Link href="/terms" className="hover:text-ink hover:underline">Terms</Link>
        <Link href="/privacy" className="hover:text-ink hover:underline">Privacy</Link>
        <Link href="/accessibility" className="hover:text-ink hover:underline">Accessibility</Link>
      </footer>

      <CountryPanel />
      <StoryViewer />
      <StoryModal />
      <AllCountries open={grid} onClose={() => setGrid(false)} />
      <Welcome />
      <Toaster />
    </>
  );
}

/* ---------------- Top bar with search ---------------- */
type Item = { type: "country" | "place"; id: string; label: string; code: string; sub: string };
const ITEMS: Item[] = [
  ...COUNTRIES.map((c) => ({ type: "country" as const, id: c.code, label: c.name, code: c.code, sub: `${c.stories.length} stories` })),
  ...COUNTRIES.flatMap((c) => c.places.map((p) => ({ type: "place" as const, id: p.id, label: p.name, code: c.code, sub: c.name }))),
];

function TopBar({ onGrid }: { onGrid: () => void }) {
  const go = useNav((s) => s.go);
  const reset = useNav((s) => s.reset);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const shown = q.trim() ? ITEMS.filter((i) => `${i.label} ${i.sub}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8) : [];

  const choose = (it?: Item) => {
    if (!it) return;
    setQ(""); setOpen(false);
    (document.activeElement as HTMLElement)?.blur();
    if (it.type === "country") go({ country: it.id, full: false, place: null, story: null });
    else go({ country: it.code, place: it.id, story: null });
  };

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.1 }}
      className="fixed inset-x-3 top-3 z-20 flex items-center gap-2 rounded-full border border-line bg-surface/90 py-1.5 pl-4 pr-1.5 shadow-[var(--shadow-sm)] backdrop-blur-md md:inset-x-4 md:top-4"
    >
      <button onClick={() => { reset(); flyHome(); }} className="flex items-center gap-2 rounded-full pr-2" aria-label="Pinwire home">
        <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true"><circle cx="16" cy="13" r="9" fill="none" stroke="currentColor" strokeWidth="2.6" /><path d="M16 22v8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /><circle cx="16" cy="13" r="4" fill="var(--mark)" stroke="currentColor" strokeWidth="1.5" /></svg>
        <span className="hidden font-display text-xl font-bold sm:inline">Pinwire</span>
      </button>

      <div className="relative ml-auto w-full max-w-md" role="search">
        <label htmlFor="q" className="sr-only">Search a country or city</label>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id="q"
          type="search"
          value={q}
          placeholder="Search a country or city"
          autoComplete="off"
          role="combobox"
          aria-expanded={open && !!q}
          aria-controls="q-list"
          aria-autocomplete="list"
          aria-activedescendant={shown[active] ? `q-${active}` : undefined}
          onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % Math.max(shown.length, 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + shown.length) % Math.max(shown.length, 1)); }
            if (e.key === "Enter") { e.preventDefault(); choose(shown[active]); }
            if (e.key === "Escape") { setQ(""); }
          }}
          className="h-11 w-full rounded-full border border-line bg-paper pl-11 pr-4 text-[15px] placeholder:text-muted focus:border-ink focus:bg-surface focus:outline-none"
        />
        <AnimatePresence>
          {open && q && (
            <motion.ul
              id="q-list"
              role="listbox"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="absolute inset-x-0 top-[calc(100%+8px)] max-h-80 overflow-auto rounded-3xl border border-line bg-surface p-1.5 shadow-[var(--shadow-lg)]"
            >
              {shown.length ? shown.map((it, i) => (
                <li
                  key={it.type + it.id}
                  id={`q-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => { e.preventDefault(); choose(it); }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 ${i === active ? "bg-paper" : ""}`}
                >
                  <Flag code={it.code} className="h-4 w-[22px] rounded-[3px]" />
                  <span className="font-medium">{it.label}</span>
                  <span className="ml-auto text-sm text-muted">{it.type === "place" ? it.sub : "Country"}</span>
                </li>
              )) : <li className="px-3 py-2.5 text-muted" role="option" aria-selected={false} aria-disabled>No matches. Try a country name.</li>}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <button onClick={onGrid} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold hover:bg-ink/5">
        <LayoutGrid className="size-5" aria-hidden="true" /><span className="hidden md:inline">All countries</span><span className="sr-only md:hidden">All countries</span>
      </button>
    </motion.header>
  );
}

/* ---------------- All countries (non-map alternative) ---------------- */
function AllCountries({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useDialog<HTMLDivElement>(open, onClose);
  const go = useNav((s) => s.go);
  useEffect(() => { if (open) ref.current?.querySelector<HTMLElement>("h2")?.focus(); }, [open, ref]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          id="all-countries"
          data-dialog
          role="dialog"
          aria-modal="true"
          aria-labelledby="all-h"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="fixed inset-0 z-[45] overflow-y-auto bg-paper"
        >
          <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-12">
            <div className="mb-8 flex items-start gap-4">
              <div className="flex-1">
                <h2 id="all-h" tabIndex={-1} className="font-display text-5xl font-bold md:text-7xl">All countries</h2>
                <p className="mt-2 text-muted">The same news as the map, as a simple list.</p>
              </div>
              <button onClick={onClose} aria-label="Close list" className="grid size-12 place-items-center rounded-full border border-line bg-surface hover:bg-ink/5"><X className="size-5" aria-hidden="true" /></button>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {COUNTRIES.map((c, i) => (
                <motion.li key={c.code} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.025 } }}>
                  <button
                    onClick={() => { onClose(); go({ country: c.code, full: true, story: null, place: null }); }}
                    className="flex w-full items-center gap-4 rounded-3xl border border-line bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
                  >
                    <Flag code={c.code} className="h-10 w-[54px] rounded-lg" />
                    <span className="min-w-0">
                      <span className="block font-display text-xl font-bold"><span className="mark">{c.name}</span></span>
                      <span className="block truncate text-sm text-muted">{c.stories.length} stories from {c.places.map((p) => p.name).join(", ")}</span>
                    </span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- First visit ---------------- */
function Welcome() {
  const welcomed = useUser((s) => s.welcomed);
  const setWelcomed = useUser((s) => s.setWelcomed);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const open = hydrated && !welcomed;
  const ref = useDialog<HTMLDivElement>(open, setWelcomed);
  useEffect(() => { if (open) setTimeout(() => ref.current?.querySelector<HTMLElement>("button")?.focus(), 50); }, [open, ref]);

  const steps = [
    ["🏳️", "Tap a flag", "to see what is happening in that country."],
    ["🔍", "Zoom in", "to find local stories from a city."],
    ["🛡️", "Vote and review", "to tell others if a story can be trusted."],
  ];
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-ink/25 p-4 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            ref={ref}
            data-dialog
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-h"
            initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.3 }}
            className="w-full max-w-md rounded-[32px] bg-surface p-7 shadow-[var(--shadow-lg)]"
          >
            <h2 id="welcome-h" className="font-display text-[40px] font-bold leading-[1.02]">World news, <span className="mark on">in plain English.</span></h2>
            <ul className="mt-6 space-y-4">
              {steps.map(([e, b, t], i) => (
                <motion.li key={b} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.5 + i * 0.1 } }} className="flex items-center gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-paper text-xl" aria-hidden="true">{e}</span>
                  <span><strong>{b}</strong> {t}</span>
                </motion.li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">
              Every story in this prototype is a sample placeholder. By continuing you agree to the <Link href="/terms" className="font-medium text-cobalt underline">Terms</Link> and <Link href="/privacy" className="font-medium text-cobalt underline">Privacy Policy</Link>.
            </p>
            <button onClick={setWelcomed} className="mt-5 min-h-12 w-full rounded-full bg-ink font-semibold text-white transition hover:bg-ink/90 active:scale-[.98]">Start exploring</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
