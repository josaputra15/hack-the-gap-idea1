"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Share2, ExternalLink, Landmark, Newspaper, Radio } from "lucide-react";
import { STORY_INDEX, COUNTRY_INDEX, ago, type Story } from "@/lib/data";
import { useNav } from "@/lib/store";
import { Flag, ScopeTag } from "./bits";
import { useDialog } from "./useDialog";
import { toast } from "./Toast";
import { PulseTeaser, PulseView } from "./Pulse";
import type { Pulse } from "@/lib/pulse";

const pulseCache = new Map<string, Pulse>();

export default function StoryModal() {
  const id = useNav((s) => s.story);
  const tab = useNav((s) => s.tab);
  const go = useNav((s) => s.go);
  const s = id ? STORY_INDEX.get(id) : undefined;
  const pulseTab = tab === "pulse";
  const close = () => go({ story: null, tab: undefined });
  const ref = useDialog<HTMLDivElement>(!!s, close);
  const [jumpTo, setJumpTo] = useState<number | null>(null);
  const [box, setBox] = useState<{ id: string; pulse: Pulse } | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => { if (s && !pulseTab) ref.current?.querySelector<HTMLElement>("#story-title")?.focus({ preventScroll: true }); }, [s, ref, pulseTab]);

  useEffect(() => {
    if (!id || !pulseTab) return;
    const hit = pulseCache.get(id);
    if (hit) { setBox({ id, pulse: hit }); setError(false); return; }
    let cancel = false;
    setError(false);
    fetch(`/api/pulse?story=${encodeURIComponent(id)}`)
      .then(async (r) => { if (!r.ok) throw new Error(); return r.json() as Promise<Pulse>; })
      .then((p) => { pulseCache.set(id, p); if (!cancel) setBox({ id, pulse: p }); })
      .catch(() => { if (!cancel) setError(true); });
    return () => { cancel = true; };
  }, [id, pulseTab, attempt]);

  const pulse = id && box?.id === id ? box.pulse : (id ? pulseCache.get(id) ?? null : null);
  const loading = pulseTab && !!id && !error && !pulse;

  const openPulse = (cite?: number) => {
    setJumpTo(cite ?? null);
    go({ tab: "pulse" });
  };

  return (
    <AnimatePresence>
      {s && (
        <motion.div
          key="story-backdrop"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/30 backdrop-blur-[2px] md:items-center md:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            ref={ref}
            data-dialog
            role="dialog"
            aria-modal="true"
            aria-labelledby="story-title"
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.98, transition: { duration: 0.18 } }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="relative flex max-h-[94dvh] w-full max-w-[760px] flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-[var(--shadow-lg)] md:max-h-[90dvh] md:rounded-[28px]"
          >
            <Head s={s} pulse={pulseTab} onClose={close} onTab={(next) => { if (next !== "pulse") setJumpTo(null); go({ tab: next === "story" ? undefined : next }); }} />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-10 pt-2 md:px-9">
              {pulseTab ? (
                <div id="panel-pulse" role="tabpanel" aria-labelledby="tab-pulse" className="mt-4">
                  <h2 id="story-title" className="sr-only">{s.headline}</h2>
                  {error ? (
                    <>
                      <p className="text-sm">This snapshot didn’t load.</p>
                      <button type="button" onClick={() => setAttempt((n) => n + 1)} className="mt-3 inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm font-semibold">Try again</button>
                    </>
                  ) : (
                    <PulseView
                      pulse={pulse}
                      loading={loading}
                      query={s.headline}
                      jumpTo={jumpTo}
                      onJumped={() => setJumpTo(null)}
                      onAsk={(q) => go({ ask: q })}
                    />
                  )}
                </div>
              ) : (
                <StoryBody s={s} onOpenPulse={openPulse} />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Head({ s, pulse, onClose, onTab }: { s: Story; pulse: boolean; onClose: () => void; onTab: (tab: "story" | "pulse") => void }) {
  const c = COUNTRY_INDEX.get(s.country)!;
  return (
    <div className="border-b border-line px-6 pt-5 pb-4 md:px-9">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Flag code={c.code} className="h-[18px] w-6 rounded-[3px]" />
        <span>{s.place ? `${s.place}, ${c.name}` : c.name}</span>
        <span aria-hidden="true">/</span>
        <span>{ago(s.hoursAgo)}</span>
        <button onClick={onClose} aria-label="Close story" className="ml-auto -mr-2 grid size-11 place-items-center rounded-full text-ink transition hover:bg-ink/5 active:scale-90">
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div role="tablist" aria-label="Story sections" className="mt-3 flex gap-1">
        <button type="button" role="tab" id="tab-story" aria-selected={!pulse} aria-controls="panel-story" onClick={() => onTab("story")} className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${pulse ? "text-muted hover:bg-paper" : "bg-ink text-white"}`}>The story</button>
        <button type="button" role="tab" id="tab-pulse" aria-selected={pulse} aria-controls="panel-pulse" onClick={() => onTab("pulse")} className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${pulse ? "bg-ink text-white" : "text-muted hover:bg-paper"}`}>What people say</button>
      </div>
    </div>
  );
}

const SOURCE_ICON = { government: Landmark, independent: Newspaper, wire: Radio };
const SOURCE_LABEL = { government: "Government source", independent: "Independent outlet", wire: "News agency" };

function StoryBody({ s, onOpenPulse }: { s: Story; onOpenPulse: (cite?: number) => void }) {
  const SrcIcon = SOURCE_ICON[s.source.kind];
  const [marked, setMarked] = useState(false);
  useEffect(() => { const id = setTimeout(() => setMarked(true), 250); return () => clearTimeout(id); }, []);

  const share = async () => {
    const url = `${location.origin}/?s=${s.id}`;
    try {
      if (navigator.share) await navigator.share({ title: s.headline, url });
      else { await navigator.clipboard.writeText(url); toast("Link copied"); }
    } catch {}
  };

  return (
    <article id="panel-story" role="tabpanel" aria-labelledby="tab-story">
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <ScopeTag local={!!s.place} />
        <span className="rounded-full bg-paper px-2.5 py-1 font-medium">{s.category}</span>
        <span className="rounded-full border border-dashed border-line-strong px-2.5 py-1 text-muted">Sample story, not real news</span>
      </div>
      <h2 id="story-title" tabIndex={-1} className="mt-4 font-display text-[34px] font-bold leading-[1.05] md:text-[44px]">
        <span className={`mark ${marked ? "on" : ""}`}>{s.headline}</span>
      </h2>
      <p className="mt-3 text-sm text-muted">Original headline: <span className="text-ink">{s.original}</span></p>

      <div className="my-6">
        <button onClick={share} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold transition hover:bg-paper">
          <Share2 className="size-4" aria-hidden="true" />Share
        </button>
      </div>

      <section className="rounded-2xl bg-paper p-5" aria-labelledby="short-h">
        <h3 id="short-h" className="mb-2 font-display text-lg font-bold">In short</h3>
        <ul className="list-disc space-y-1 pl-5 text-[17px] leading-relaxed">{s.points.map((p) => <li key={p}>{p}</li>)}</ul>
      </section>
      <section className="mt-4 rounded-2xl border-l-4 border-mark bg-[#fffbe8] p-5" aria-labelledby="why-h">
        <h3 id="why-h" className="mb-1 font-display text-lg font-bold">Why it matters</h3>
        <p className="text-[17px] leading-relaxed">{s.why}</p>
        <PulseTeaser story={s} onOpen={onOpenPulse} />
      </section>
      <h3 className="mt-8 mb-2 font-display text-xl font-bold">What happened</h3>
      <p className="max-w-[65ch] text-[17px] leading-[1.75]">{s.body}</p>

      <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-line p-4">
        <span className="grid size-12 place-items-center rounded-xl bg-cobalt-soft text-cobalt">
          <SrcIcon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{s.source.name}</p>
          <p className="text-sm text-muted">{SOURCE_LABEL[s.source.kind]}</p>
        </div>
        <a href={s.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-ink/90">
          Read original<ExternalLink className="size-4" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </article>
  );
}
