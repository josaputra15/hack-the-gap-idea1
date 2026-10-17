"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { Maximize2, Minimize2, X, MessageSquareText, MapPin, Flame, Clock, ShieldCheck, Swords } from "lucide-react";
import { COUNTRY_INDEX, EMOJI, ago, type Story, type Country } from "@/lib/data";
import { useNav, useUser, scoreOf, reviewsOf, trustOf } from "@/lib/store";
import { Vote, TrustBadge, Flag, TagChip } from "./bits";

type Sort = "top" | "new" | "trusted" | "debated";
const SORTS: { id: Sort; label: string; Icon: typeof Flame }[] = [
  { id: "top", label: "Top", Icon: Flame },
  { id: "new", label: "Newest", Icon: Clock },
  { id: "trusted", label: "Most trusted", Icon: ShieldCheck },
  { id: "debated", label: "Debated", Icon: Swords },
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
  const mine = useUser((s) => s.myReviews);
  const all = c.stories.flatMap((s) => reviewsOf(s, mine));
  const t = trustOf(all);
  return (
    <motion.header layout="position" className={`flex items-center gap-4 ${full ? "mx-auto w-full max-w-6xl px-5 pt-6 pb-4 md:px-8 md:pt-8" : "px-5 pt-4 pb-3"}`}>
      {!full && <div className="absolute left-1/2 top-2 h-1.5 w-11 -translate-x-1/2 rounded-full bg-line md:hidden" aria-hidden="true" />}
      <motion.div layout className={`shrink-0 overflow-hidden rounded-xl shadow-[var(--shadow-sm)] ${full ? "h-14 w-[74px] md:h-20 md:w-[106px]" : "h-10 w-[54px]"}`}>
        <Flag code={c.code} className="h-full w-full" />
      </motion.div>
      <div className="min-w-0 flex-1">
        <motion.h2
          layout="position"
          id="country-title"
          ref={titleRef}
          tabIndex={-1}
          className={`font-display font-bold leading-none ${full ? "text-4xl md:text-6xl" : "text-[28px]"}`}
        >
          {c.name}
        </motion.h2>
        <p className="mt-1.5 text-sm text-muted">
          {c.stories.length} stories in {c.places.length} cities
          {t && <> and <span className={t.pct >= 60 ? "text-[var(--trust)] font-medium" : "text-[var(--warn)] font-medium"}>{t.pct}% community trust</span></>}
        </p>
      </div>
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
    </motion.header>
  );
}

function useSorted(c: Country, sort: Sort, cat: string | null) {
  const votes = useUser((s) => s.votes);
  const mine = useUser((s) => s.myReviews);
  return useMemo(() => {
    const list = c.stories.filter((s) => !cat || s.category === cat);
    const trust = (s: Story) => trustOf(reviewsOf(s, mine))?.pct ?? -1;
    const spread = (s: Story) => {
      const r = reviewsOf(s, mine);
      if (r.length < 2) return -1;
      const good = r.filter((x) => x.rating >= 4).length;
      return r.length - Math.abs(good - (r.length - good)) * 2;
    };
    const by: Record<Sort, (a: Story, b: Story) => number> = {
      top: (a, b) => scoreOf(b, votes) - scoreOf(a, votes),
      new: (a, b) => a.hoursAgo - b.hoursAgo,
      trusted: (a, b) => trust(b) - trust(a),
      debated: (a, b) => spread(b) - spread(a),
    };
    return [...list].sort(by[sort]);
  }, [c, sort, cat, votes, mine]);
}

function SortTabs({ sort, setSort }: { sort: Sort; setSort: (s: Sort) => void }) {
  return (
    <div role="tablist" aria-label="Sort stories" className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-ink/[0.04] p-1">
      {SORTS.map(({ id, label, Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={sort === id}
          onClick={() => setSort(id)}
          className={`relative inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition ${sort === id ? "text-ink" : "text-muted hover:text-ink"}`}
        >
          {sort === id && <motion.span layoutId="sort-pill" className="absolute inset-0 rounded-full bg-surface shadow-[var(--shadow-sm)]" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
          <Icon className="relative size-4" aria-hidden="true" />
          <span className="relative">{label}</span>
        </button>
      ))}
    </div>
  );
}

function Places({ c, big }: { c: Country; big?: boolean }) {
  const go = useNav((s) => s.go);
  const seen = useUser((s) => s.seen);
  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto py-1" aria-label="Local stories by city">
      {c.places.map((p) => (
        <button key={p.id} onClick={() => go({ place: p.id })} className="group flex shrink-0 flex-col items-center gap-1.5" aria-label={`${p.name}: play ${p.stories.length} local stories`}>
          <span
            className={`grid place-items-center rounded-full p-[3px] transition group-hover:scale-105 ${big ? "size-[76px]" : "size-[60px]"}`}
            style={{ background: seen.includes(p.id) ? "var(--line-strong)" : "conic-gradient(from 210deg, var(--mark), #ff8a3d, #ff3d7f, var(--cobalt), var(--mark))" }}
          >
            <span className={`grid h-full w-full place-items-center rounded-full border-[3px] border-surface bg-surface ${big ? "text-3xl" : "text-2xl"}`} aria-hidden="true">
              {EMOJI[p.stories[0].category] ?? "📰"}
            </span>
          </span>
          <span className="text-xs font-semibold">{p.name}</span>
        </button>
      ))}
    </div>
  );
}

function StoryRow({ s, i }: { s: Story; i: number }) {
  const go = useNav((st) => st.go);
  const mine = useUser((st) => st.myReviews);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.03, 0.3) } }}
      className="grid grid-cols-[44px_1fr] gap-2 border-t border-line px-3 py-3.5"
    >
      <Vote story={s} />
      <div className="min-w-0">
        <button onClick={() => go({ story: s.id })} className="block w-full rounded-lg text-left">
          <span className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
            <span className="font-medium text-ink">{EMOJI[s.category]} {s.category}</span>
            <span>{s.place ?? "Nationwide"}</span>
            <span>{ago(s.hoursAgo)}</span>
          </span>
          <span className="text-[17px] font-semibold leading-snug"><span className="mark">{s.headline}</span></span>
        </button>
        <span className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted">
          <TrustBadge story={s} />
          <span className="inline-flex items-center gap-1"><MessageSquareText className="size-3.5" aria-hidden="true" />{reviewsOf(s, mine).length}<span className="sr-only"> reviews</span></span>
        </span>
      </div>
    </motion.li>
  );
}

function DrawerBody({ c }: { c: Country }) {
  const [sort, setSort] = useState<Sort>("top");
  const list = useSorted(c, sort, null);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 px-5 pb-3">
        <Places c={c} />
        <SortTabs sort={sort} setSort={setSort} />
      </div>
      <LayoutGroup>
        <ol className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-6">
          {list.map((s, i) => <StoryRow key={s.id} s={s} i={i} />)}
        </ol>
      </LayoutGroup>
    </div>
  );
}

/* ---------------- Full-screen country view ---------------- */
function FullBody({ c }: { c: Country }) {
  const [sort, setSort] = useState<Sort>("top");
  const [cat, setCat] = useState<string | null>(null);
  const list = useSorted(c, sort, cat);
  const cats = [...new Set(c.stories.map((s) => s.category))];
  const mine = useUser((s) => s.myReviews);
  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    c.stories.forEach((s) => reviewsOf(s, mine).forEach((r) => r.tags.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1))));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [c, mine]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.15 } }} className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-16 md:grid-cols-[1fr_320px] md:px-8">
        <section aria-label="Stories" className="min-w-0">
          <div className="sticky top-0 z-10 -mx-5 mb-4 space-y-3 bg-paper/90 px-5 py-3 backdrop-blur md:-mx-8 md:px-8">
            <SortTabs sort={sort} setSort={setSort} />
            <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Filter by topic">
              <FilterChip on={!cat} onClick={() => setCat(null)}>All topics</FilterChip>
              {cats.map((k) => <FilterChip key={k} on={cat === k} onClick={() => setCat(cat === k ? null : k)}>{EMOJI[k]} {k}</FilterChip>)}
            </div>
          </div>
          <LayoutGroup>
            <ol className="grid gap-4 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {list.map((s, i) => <StoryCard key={s.id} s={s} i={i} lead={i === 0 && sort === "top" && !cat} />)}
              </AnimatePresence>
            </ol>
          </LayoutGroup>
        </section>

        <aside className="space-y-6 md:pt-3" aria-label="More about this country">
          <section className="rounded-3xl border border-line bg-surface p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><MapPin className="size-5 text-cobalt" aria-hidden="true" />Local stories</h3>
            <Places c={c} big />
          </section>
          {tagCounts.length > 0 && (
            <section className="rounded-3xl border border-line bg-surface p-5">
              <h3 className="font-display text-lg font-bold">What reviewers say</h3>
              <p className="mb-3 text-sm text-muted">Most-used quick reviews on {c.name} stories.</p>
              <div className="flex flex-wrap gap-2">{tagCounts.map(([id, n]) => <TagChip key={id} id={id} count={n} />)}</div>
            </section>
          )}
          <p className="px-1 text-xs text-muted">All stories here are sample placeholders for the prototype.</p>
        </aside>
      </div>
    </motion.div>
  );
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
  const mine = useUser((st) => st.myReviews);
  const reviews = reviewsOf(s, mine);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.04, 0.4) } }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`group flex flex-col rounded-3xl border border-line bg-surface p-5 transition-shadow hover:shadow-[var(--shadow-sm)] ${lead ? "sm:col-span-2 sm:p-7" : ""}`}
    >
      <div className="mb-3 flex items-center gap-2 text-[13px] text-muted">
        <span className="rounded-full bg-paper px-2.5 py-1 font-medium text-ink">{EMOJI[s.category]} {s.category}</span>
        <span>{s.place ?? "Nationwide"}</span>
        <span className="ml-auto">{ago(s.hoursAgo)}</span>
      </div>
      <button onClick={() => go({ story: s.id })} className="flex-1 rounded-xl text-left">
        <h3 className={`font-display font-bold leading-[1.1] ${lead ? "text-3xl md:text-[40px]" : "text-[22px]"}`}>
          <span className="mark">{s.headline}</span>
        </h3>
        <p className={`mt-2 text-muted ${lead ? "text-base max-w-[60ch]" : "text-sm"}`}>{s.points[0]} {lead && s.points[1]}</p>
      </button>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
        <Vote story={s} layout="row" />
        <TrustBadge story={s} />
        <button onClick={() => go({ story: s.id })} className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-cobalt hover:bg-cobalt-soft">
          <MessageSquareText className="size-4" aria-hidden="true" />
          {reviews.length ? `${reviews.length} reviews` : "Review"}
        </button>
      </div>
    </motion.li>
  );
}
