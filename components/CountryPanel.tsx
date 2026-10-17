"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { Check, ChevronDown, Clock, Maximize2, Minimize2, X } from "lucide-react";
import { COUNTRY_INDEX, ago, goingOnIn, type Story, type Country } from "@/lib/data";
import { useNav } from "@/lib/store";
import { Flag, ScopeTag } from "./bits";

type When = "all" | 24 | 72 | 168;
type Scope = "all" | "local" | "international";
const WHEN: { id: When; label: string }[] = [
  { id: "all", label: "Any time" },
  { id: 24, label: "Within 24 hours" },
  { id: 72, label: "Within 3 days" },
  { id: 168, label: "Within a week" },
];

export default function CountryPanel() {
  const { country: code, full, go } = useNav();
  const c = code ? COUNTRY_INDEX.get(code) : undefined;
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { if (c) titleRef.current?.focus({ preventScroll: true }); }, [c, full]);

  return (
    <AnimatePresence>
      {c && (
        <motion.aside
          key="panel"
          layout
          aria-labelledby="country-title"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
          transition={{ layout: { type: "spring", stiffness: 260, damping: 32 }, default: { type: "spring", stiffness: 300, damping: 32 } }}
          className={
            full
              ? "fixed inset-0 z-40 flex flex-col overflow-hidden bg-paper"
              : "fixed z-30 flex flex-col overflow-hidden bg-surface shadow-[var(--shadow-lg)] border border-line " +
                "inset-x-0 bottom-0 h-[78dvh] rounded-t-[28px] md:inset-x-auto md:top-[84px] md:right-4 md:bottom-4 md:h-auto md:w-[440px] md:rounded-[28px]"
          }
          style={{ borderRadius: full ? 0 : undefined }}
        >
          <Header c={c} full={full} titleRef={titleRef} onFull={() => go({ full: !full })} onClose={() => go({ country: null, full: false, story: null, place: null })} />
          {full ? <FullBody c={c} /> : <DrawerBody c={c} />}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Header({ c, full, titleRef, onFull, onClose }: { c: Country; full: boolean; titleRef: React.RefObject<HTMLHeadingElement | null>; onFull: () => void; onClose: () => void }) {
  return (
    <motion.header layout="position" className={full ? "mx-auto w-full max-w-6xl px-5 pt-6 pb-4 md:px-8 md:pt-8" : "px-5 pt-4 pb-3"}>
      {!full && <div className="absolute left-1/2 top-2 h-1.5 w-11 -translate-x-1/2 rounded-full bg-line md:hidden" aria-hidden="true" />}
      <div className="flex items-center justify-between gap-3">
        <motion.div layout className={`shrink-0 overflow-hidden rounded-xl shadow-[var(--shadow-sm)] ${full ? "h-14 w-[74px] md:h-20 md:w-[106px]" : "h-10 w-[54px]"}`}>
          <Flag code={c.code} className="h-full w-full" />
        </motion.div>
        <div className="flex items-center gap-2">
          <button
            onClick={onFull}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold shadow-[var(--shadow-sm)] transition hover:border-line-strong active:scale-95"
            aria-label={full ? "Exit full screen" : "Open full screen"}
          >
            {full ? <Minimize2 className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
            <span className="hidden sm:inline">{full ? "Back to map" : "Full screen"}</span>
          </button>
          <button onClick={onClose} aria-label={`Close ${c.name}`} className="grid size-11 shrink-0 place-items-center rounded-full transition hover:bg-ink/5 active:scale-90">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <motion.h2
        layout="position"
        id="country-title"
        ref={titleRef}
        tabIndex={-1}
        className={`mt-3 font-display font-bold leading-[1.08] ${full ? "text-4xl md:text-6xl" : "text-[26px]"}`}
      >
        {goingOnIn(c.name)}
      </motion.h2>
      <p className="mt-1.5 text-sm text-muted">
        {c.stories.length} stories in {c.places.length} cities
      </p>
    </motion.header>
  );
}

const isLocal = (s: Story) => !!s.place;

function useSorted(c: Country, cat: string | null, when: When, scope: Scope) {
  return useMemo(() => {
    const list = c.stories.filter((s) => {
      if (cat && s.category !== cat) return false;
      if (when !== "all" && s.hoursAgo > when) return false;
      if (scope === "local" && !isLocal(s)) return false;
      if (scope === "international" && isLocal(s)) return false;
      return true;
    });
    return [...list].sort((a, b) => a.hoursAgo - b.hoursAgo);
  }, [c, cat, when, scope]);
}

function StoryRow({ s, i }: { s: Story; i: number }) {
  const go = useNav((st) => st.go);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.03, 0.3) } }}
      className="border-t border-line px-3 py-3.5"
    >
      <button onClick={() => go({ story: s.id, tab: undefined })} className="block w-full rounded-lg text-left">
        <span className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
          <ScopeTag local={isLocal(s)} />
          <span className="font-medium text-ink">{s.category}</span>
          <span>{s.place ?? "Nationwide"}</span>
          <span className="ml-auto">{ago(s.hoursAgo)}</span>
        </span>
        <span className="text-[17px] font-semibold leading-snug"><span className="mark">{s.headline}</span></span>
      </button>
    </motion.li>
  );
}

function DrawerBody({ c }: { c: Country }) {
  const [when, setWhen] = useState<When>("all");
  const [scope, setScope] = useState<Scope>("all");
  const list = useSorted(c, null, when, scope);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 px-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ScopeSwitch scope={scope} setScope={setScope} />
          <TimeMenu when={when} setWhen={setWhen} />
        </div>
      </div>
      <LayoutGroup>
        <ol className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-6">
          {list.length === 0 ? <EmptyList when={when} scope={scope} /> : list.map((s, i) => <StoryRow key={s.id} s={s} i={i} />)}
        </ol>
      </LayoutGroup>
    </div>
  );
}

function FullBody({ c }: { c: Country }) {
  const [cat, setCat] = useState<string | null>(null);
  const [when, setWhen] = useState<When>("all");
  const [scope, setScope] = useState<Scope>("all");
  const list = useSorted(c, cat, when, scope);
  const cats = useMemo(
    () => [...new Set(c.stories.filter((s) => scope === "all" || (scope === "local" ? isLocal(s) : !isLocal(s))).map((s) => s.category))],
    [c, scope],
  );
  useEffect(() => {
    if (cat && !cats.includes(cat)) setCat(null);
  }, [cat, cats]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.15 } }} className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
        <section aria-label="Stories" className="min-w-0">
          <div className="sticky top-0 z-20 -mx-5 mb-4 space-y-3 bg-paper/90 px-5 py-3 backdrop-blur md:-mx-8 md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ScopeSwitch scope={scope} setScope={setScope} />
              <TimeMenu when={when} setWhen={setWhen} />
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Filter by topic">
              <FilterChip on={!cat} onClick={() => setCat(null)}>All topics</FilterChip>
              {cats.map((k) => <FilterChip key={k} on={cat === k} onClick={() => setCat(cat === k ? null : k)}>{k}</FilterChip>)}
            </div>
          </div>
          <LayoutGroup>
            <ol className="grid gap-4 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {list.length === 0
                  ? <EmptyList when={when} scope={scope} />
                  : list.map((s, i) => <StoryCard key={s.id} s={s} i={i} lead={i === 0 && !cat && when === "all" && scope === "all"} />)}
              </AnimatePresence>
            </ol>
          </LayoutGroup>
          <p className="mt-8 text-xs text-muted">All stories here are sample placeholders for the prototype.</p>
        </section>
      </div>
    </motion.div>
  );
}

function ScopeSwitch({ scope, setScope }: { scope: Scope; setScope: (s: Scope) => void }) {
  const items: { id: Scope; label: string }[] = [
    { id: "all", label: "All" },
    { id: "local", label: "Local" },
    { id: "international", label: "International" },
  ];
  return (
    <div role="radiogroup" aria-label="Local or international news" className="inline-flex rounded-full bg-ink/[0.04] p-1">
      {items.map(({ id, label }) => (
        <button
          key={id}
          role="radio"
          aria-checked={scope === id}
          onClick={() => setScope(id)}
          className={`min-h-9 rounded-full px-3 text-sm font-semibold transition ${scope === id ? "bg-surface text-ink shadow-[var(--shadow-sm)]" : "text-muted hover:text-ink"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function TimeMenu({ when, setWhen }: { when: When; setWhen: (w: When) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = WHEN.find((w) => w.id === when)?.label ?? "Any time";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border bg-surface px-3 text-sm font-semibold transition hover:border-line-strong ${when === "all" ? "border-line text-ink" : "border-ink text-ink"}`}
      >
        <Clock className="size-4 text-muted" aria-hidden="true" />
        {label}
        <ChevronDown className={`size-4 text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="Filter by date"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[calc(100%+8px)] z-30 w-52 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-[var(--shadow-lg)]"
          >
            {WHEN.map(({ id, label: item }) => (
              <li key={id} role="option" aria-selected={when === id}>
                <button
                  type="button"
                  onClick={() => { setWhen(id); setOpen(false); }}
                  className={`flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-medium ${when === id ? "bg-paper text-ink" : "text-ink hover:bg-paper"}`}
                >
                  <Check className={`size-4 ${when === id ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
                  {item}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyList({ when, scope }: { when: When; scope: Scope }) {
  const time = when === "all" ? "" : ` ${WHEN.find((w) => w.id === when)?.label.toLowerCase()}`;
  const kind = scope === "local" ? "local stories" : scope === "international" ? "international stories" : "stories";
  return <li className="col-span-full px-3 py-10 text-center text-sm text-muted">No {kind}{time}.</li>;
}

function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium transition ${on ? "border-ink bg-ink text-white" : "border-line bg-surface hover:border-line-strong"}`}
    >
      {children}
    </button>
  );
}

function StoryCard({ s, i, lead }: { s: Story; i: number; lead: boolean }) {
  const go = useNav((st) => st.go);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.04, 0.4) } }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`group flex min-w-0 flex-col rounded-3xl border border-line bg-surface p-5 transition-shadow hover:shadow-[var(--shadow-sm)] ${lead ? "sm:col-span-2 sm:p-7" : ""}`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px] text-muted">
        <ScopeTag local={isLocal(s)} />
        <span className="rounded-full bg-paper px-2.5 py-1 font-medium text-ink">{s.category}</span>
        <span>{s.place ?? "Nationwide"}</span>
        <span className="ml-auto">{ago(s.hoursAgo)}</span>
      </div>
      <button onClick={() => go({ story: s.id, tab: undefined })} className="flex-1 rounded-xl text-left">
        <h3 className={`font-display font-bold leading-[1.1] ${lead ? "text-3xl md:text-[40px]" : "text-[22px]"}`}>
          <span className="mark">{s.headline}</span>
        </h3>
        <p className={`mt-2 text-muted ${lead ? "text-base max-w-[60ch]" : "text-sm"}`}>{s.points[0]} {lead && s.points[1]}</p>
      </button>
    </motion.li>
  );
}
