"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Pause, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { PLACE_INDEX, COUNTRY_INDEX, EMOJI, ago } from "@/lib/data";
import { useNav, useUser } from "@/lib/store";
import { Vote, TrustBadge, Flag } from "./bits";
import { useDialog } from "./useDialog";

const STORY_MS = 7000;
const TINT: Record<string, string> = {
  Environment: "#dff5e8", Weather: "#dcebfb", Transport: "#ffe9d6", Tech: "#e4e6ff", Culture: "#ffe1ec", Food: "#fff0d1",
  Economy: "#e2f3f1", Sport: "#fff6c9", Politics: "#ece7ff", Health: "#e0f4f8", Energy: "#fff7cc", Science: "#e6ecff",
  Education: "#e9f6dd", Society: "#f4e6ff",
};

export default function StoryViewer() {
  const placeId = useNav((s) => s.place);
  const story = useNav((s) => s.story);
  const go = useNav((s) => s.go);
  const markSeen = useUser((s) => s.markSeen);
  const p = placeId ? PLACE_INDEX.get(placeId) : undefined;
  const close = useCallback(() => go({ place: null }), [go]);
  const ref = useDialog<HTMLDivElement>(!!p, close);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const elapsed = useRef(0);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!p) return;
    setI(0);
    setPaused(matchMedia("(prefers-reduced-motion: reduce)").matches);
    markSeen(p.id);
    ref.current?.querySelector<HTMLElement>("[data-close]")?.focus();
  }, [p, markSeen, ref]);

  const next = useCallback(() => {
    if (!p) return;
    if (i < p.stories.length - 1) setI(i + 1);
    else close();
  }, [i, p, close]);
  const prev = () => setI((x) => Math.max(0, x - 1));

  useEffect(() => { elapsed.current = 0; setProgress(0); }, [i, placeId]);

  // timer pauses while the story detail is open on top
  useEffect(() => {
    if (!p || paused || story) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      setProgress(Math.min(1, elapsed.current / STORY_MS));
      if (elapsed.current >= STORY_MS) { next(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [p, paused, story, next]);

  useEffect(() => {
    if (!p) return;
    const onKey = (e: KeyboardEvent) => {
      if (story) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " " && (e.target as HTMLElement).tagName !== "BUTTON") { e.preventDefault(); setPaused((x) => !x); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [p, story, next]);

  const s = p?.stories[i];
  const c = p ? COUNTRY_INDEX.get(p.country) : undefined;

  return (
    <AnimatePresence>
      {p && s && c && (
        <motion.div
          key="viewer"
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            ref={ref}
            data-dialog
            role="dialog"
            aria-modal="true"
            aria-label={`Local stories from ${p.name}`}
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0, backgroundColor: TINT[s.category] ?? "#eef2f8" }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, backgroundColor: { duration: 0.5 } }}
            className="relative flex h-dvh w-full flex-col overflow-hidden text-ink sm:h-[min(800px,92dvh)] sm:w-[420px] sm:rounded-[32px] sm:shadow-[var(--shadow-lg)]"
            onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
            onTouchEnd={(e) => {
              if (!touch.current) return;
              const dx = e.changedTouches[0].clientX - touch.current.x, dy = e.changedTouches[0].clientY - touch.current.y;
              if (dy > 90 && Math.abs(dx) < 60) close();
              else if (Math.abs(dx) > 60 && Math.abs(dy) < 60) (dx < 0 ? next : prev)();
              touch.current = null;
            }}
          >
            <div className="flex gap-1 px-3 pt-3" aria-hidden="true">
              {p.stories.map((_, j) => (
                <span key={j} className="h-[3px] flex-1 overflow-hidden rounded-full bg-ink/15">
                  <span className="block h-full bg-ink" style={{ width: `${j < i ? 100 : j === i ? progress * 100 : 0}%` }} />
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 px-4 pt-3">
              <Flag code={c.code} className="size-9 rounded-full border-2 border-white" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">{p.name}</p>
                <p className="text-xs text-muted">{c.name}, {ago(s.hoursAgo)}. Story {i + 1} of {p.stories.length}</p>
              </div>
              <button onClick={() => setPaused((x) => !x)} aria-pressed={paused} aria-label={paused ? "Play stories" : "Pause stories"} className="grid size-11 place-items-center rounded-full hover:bg-ink/10">
                {paused ? <Play className="size-5" aria-hidden="true" /> : <Pause className="size-5" aria-hidden="true" />}
              </button>
              <button data-close onClick={close} aria-label="Close stories" className="grid size-11 place-items-center rounded-full hover:bg-ink/10">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <button onClick={prev} aria-label="Previous story" className="absolute left-0 top-24 bottom-48 z-10 w-1/4 opacity-0 focus-visible:opacity-100"><ChevronLeft className="ml-2 size-6" /></button>
            <button onClick={next} aria-label="Next story" className="absolute right-0 top-24 bottom-48 z-10 w-1/4 opacity-0 focus-visible:opacity-100"><ChevronRight className="ml-auto mr-2 size-6" /></button>

            <AnimatePresence mode="wait">
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex flex-1 flex-col px-6 pb-7"
                aria-live="polite"
              >
                <motion.div className="mt-8 text-[96px] leading-none" aria-hidden="true" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
                  {EMOJI[s.category] ?? "📰"}
                </motion.div>
                <div className="mt-auto">
                  <span className="mb-3 inline-block rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">{s.category}, sample story</span>
                  <h2 className="font-display text-[40px] font-bold leading-[1.02]"><span className="mark on">{s.headline}</span></h2>
                  <ul className="mt-4 list-disc space-y-1 pl-5 text-[16px]">{s.points.map((x) => <li key={x}>{x}</li>)}</ul>
                  <div className="mt-3"><TrustBadge story={s} /></div>
                  <div className="relative z-20 mt-5 flex items-center gap-2">
                    <div className="rounded-full bg-white/80"><Vote story={s} layout="row" /></div>
                    <button onClick={() => go({ story: s.id })} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition active:scale-95">
                      Read more and review
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
