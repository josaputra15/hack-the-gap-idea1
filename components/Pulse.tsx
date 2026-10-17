"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Check, ExternalLink, Film, Heart, Image as ImageIcon, MessageCircle } from "lucide-react";
import type { Story } from "@/lib/data";
import { getStoryPulse, type Pulse, type PulseSource } from "@/lib/pulse";

const KIND = {
  reel: { label: "Instagram reel", Icon: Film },
  post: { label: "Instagram post", Icon: ImageIcon },
  comment: { label: "Comment", Icon: MessageCircle },
} as const;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

export function PulseView({
  pulse,
  loading,
  query,
  onAsk,
  jumpTo,
  onJumped,
}: {
  pulse: Pulse | null;
  loading: boolean;
  query: string;
  onAsk: (q: string) => void;
  jumpTo?: number | null;
  onJumped?: () => void;
}) {
  const reduced = useReducedMotion();
  const [topic, setTopic] = useState("all");
  const [limit, setLimit] = useState(5);
  const [flashN, setFlashN] = useState<number | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [marked, setMarked] = useState(false);
  const [status, setStatus] = useState("");
  const flash = flashN == null ? null : { n: flashN, on: flashOn };

  useEffect(() => {
    setTopic("all");
    setLimit(5);
    setFlashN(null);
    setFlashOn(false);
    setMarked(false);
  }, [pulse?.query]);

  useEffect(() => {
    if (!pulse || reduced) { setMarked(true); return; }
    const id = window.setTimeout(() => setMarked(true), 250);
    return () => window.clearTimeout(id);
  }, [pulse, reduced]);

  useEffect(() => {
    if (loading) return;
    if (pulse) setStatus(`Snapshot ready. ${pulse.sentences[0]?.text ?? ""}`);
  }, [loading, pulse]);

  const jump = (n: number) => {
    setTopic("all");
    setLimit((cur) => Math.max(cur, n));
    setFlashOn(false);
    setFlashN(n);
    window.setTimeout(() => {
      const el = document.getElementById(`pulse-src-${n}`);
      const scroller = el?.closest<HTMLElement>(".overflow-y-auto");
      if (el && scroller) {
        const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 16;
        scroller.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
      }
      setFlashOn(true);
      window.setTimeout(() => {
        setFlashN((cur) => (cur === n ? null : cur));
        setFlashOn(false);
      }, 1600);
    }, reduced ? 0 : 40);
  };

  useEffect(() => {
    if (!pulse || jumpTo == null) return;
    jump(jumpTo);
    onJumped?.();
    // onJumped clears the request; jump reads the latest setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulse, jumpTo]);

  return (
    <div>
      <p className="sr-only" aria-live="polite">{status}</p>
      {loading || !pulse ? (
        <LoadingCard query={query} onStatus={setStatus} />
      ) : (
        <Snapshot
          pulse={pulse}
          reduced={reduced}
          marked={marked}
          topic={topic}
          limit={limit}
          flash={flash}
          onTopic={(id) => { setTopic(id); setLimit(5); }}
          onShowAll={() => setLimit(pulse.sources.length)}
          onJump={jump}
          onAsk={onAsk}
        />
      )}
    </div>
  );
}

function Snapshot({
  pulse, reduced, marked, topic, limit, flash, onTopic, onShowAll, onJump, onAsk,
}: {
  pulse: Pulse;
  reduced: boolean;
  marked: boolean;
  topic: string;
  limit: number;
  flash: { n: number; on: boolean } | null;
  onTopic: (id: string) => void;
  onShowAll: () => void;
  onJump: (n: number) => void;
  onAsk: (q: string) => void;
}) {
  const byN = useMemo(() => new Map(pulse.sources.map((s) => [s.n, s])), [pulse.sources]);
  const filtered = topic === "all" ? pulse.sources : pulse.sources.filter((s) => s.topic === topic);
  const visible = filtered.slice(0, limit);
  const mood = [
    { key: "worried", label: "worried", value: pulse.mood.worried, color: "var(--warn)" },
    { key: "hopeful", label: "hopeful", value: pulse.mood.hopeful, color: "var(--trust)" },
    { key: "neutral", label: "neutral", value: pulse.mood.neutral, color: "var(--muted)" },
    { key: "angry", label: "angry", value: pulse.mood.angry, color: "var(--flag)" },
  ];

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl font-bold">What people say</h3>
          <p className="mt-1 text-sm text-muted">
            Snapshot from {pulse.postsAnalyzed.toLocaleString()} public posts, {pulse.window}. Updated {pulse.updated}.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-mark px-2.5 py-1 text-xs font-semibold text-ink">Demo data</span>
      </div>

      <div className="mt-5 space-y-3 text-[19px] leading-relaxed">
        {pulse.sentences.map((sentence, i) => (
          <p key={i}>
            {i === 0 ? <span className={`mark ${marked ? "on" : ""}`}>{sentence.text}</span> : sentence.text}
            {" "}
            <span className="whitespace-nowrap">
              {[...sentence.cites].sort((a, b) => a - b).map((n) => {
                const source = byN.get(n);
                return source ? <CiteChip key={n} source={source} onJump={onJump} /> : null;
              })}
            </span>
          </p>
        ))}
      </div>

      <div className="mt-6">
        <div aria-hidden="true" className="flex h-3 w-full overflow-hidden rounded-full bg-line">
          {mood.map((s) => (
            <motion.div
              key={s.key}
              className="h-full shrink-0"
              style={{ background: s.color }}
              initial={reduced ? { flexBasis: `${s.value}%` } : { flexBasis: "0%" }}
              animate={{ flexBasis: `${s.value}%` }}
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 20 }}
            />
          ))}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {mood.map((s) => (
            <li key={s.key} style={{ color: s.color }}>{s.value}% {s.label}</li>
          ))}
        </ul>
      </div>

      <div role="group" aria-label="Filter sources by topic" className="mt-5 flex flex-wrap gap-2">
        <TopicButton pressed={topic === "all"} onClick={() => onTopic("all")}>All</TopicButton>
        {pulse.topics.map((t) => (
          <TopicButton key={t.id} pressed={topic === t.id} onClick={() => onTopic(t.id)}>
            {t.label}
          </TopicButton>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {visible.map((s) => {
          const meta = KIND[s.kind];
          const Icon = meta.Icon;
          const lit = flash?.n === s.n;
          return (
            <li key={s.n} id={`pulse-src-${s.n}`} className="scroll-mt-24 rounded-3xl border border-line bg-surface p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="grid size-6 place-items-center rounded-full bg-cobalt-soft text-xs font-semibold text-cobalt">{s.n}</span>
                <Icon className="size-4 text-muted" aria-hidden="true" />
                <span>{meta.label}</span>
                <span className="text-muted">{s.handle}</span>
                <span className="ml-auto text-muted">{s.ago}</span>
              </div>
              <p className={`mt-2 text-[17px] leading-relaxed ${lit ? "mark" : ""} ${lit && flash?.on ? "on" : ""}`}>“{s.excerpt}”</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
                <span className="inline-flex items-center gap-1"><Heart className="size-4" aria-hidden="true" />{s.likes.toLocaleString()} likes</span>
                {s.comments != null && (
                  <span className="inline-flex items-center gap-1"><MessageCircle className="size-4" aria-hidden="true" />{s.comments.toLocaleString()} comments</span>
                )}
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 font-semibold text-cobalt hover:bg-cobalt-soft">
                  Open post<ExternalLink className="size-4" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </li>
          );
        })}
      </ul>
      {limit < filtered.length && (
        <button type="button" onClick={onShowAll} className="mt-3 inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold hover:bg-paper">
          Show all {filtered.length} sources
        </button>
      )}

      <div className="mt-8">
        <h4 className="font-display text-lg font-bold">People also ask</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {pulse.related.map((q) => (
            <button key={q} type="button" onClick={() => onAsk(q)} className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-left text-sm font-semibold hover:bg-paper">
              {q}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-6 text-sm text-muted">This shows what people are posting, not checked facts. Read the story for facts.</p>
    </div>
  );
}

function TopicButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${pressed ? "bg-ink text-white" : "border border-line bg-surface hover:bg-paper"}`}
    >
      {children}
    </button>
  );
}

function CiteChip({ source, onJump }: { source: PulseSource; onJump: (n: number) => void }) {
  const btn = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<{ top: number; left: number } | null>(null);
  const hideTimer = useRef<number>(0);
  const meta = KIND[source.kind];
  const Icon = meta.Icon;

  const place = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const width = 288;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - width / 2), window.innerWidth - width - 8);
    const top = r.bottom + 8 + 200 > window.innerHeight ? Math.max(8, r.top - 8 - 200) : r.bottom + 8;
    setBox({ top, left });
  };
  const show = () => {
    window.clearTimeout(hideTimer.current);
    place();
    setOpen(true);
  };
  const hide = () => {
    hideTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  return (
    <span className="relative inline-flex align-middle" onMouseEnter={show} onMouseLeave={hide}>
      <button
        ref={btn}
        type="button"
        aria-label={`Source ${source.n}: ${meta.label} by ${source.handle}`}
        onClick={() => onJump(source.n)}
        onFocus={show}
        onBlur={(e) => { if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) hide(); }}
        className="relative mx-0.5 inline-flex size-6 items-center justify-center rounded-full align-middle before:absolute before:-inset-2.5 before:content-['']"
      >
        <span className="grid size-6 place-items-center rounded-full bg-cobalt-soft text-sm font-semibold text-cobalt">{source.n}</span>
      </button>
      {open && box && createPortal(
        <span
          role="tooltip"
          onMouseEnter={show}
          onMouseLeave={hide}
          onMouseDown={(e) => e.preventDefault()}
          style={{ position: "fixed", top: box.top, left: box.left, width: 288, zIndex: 80 }}
          className="rounded-2xl border border-line bg-surface p-3 text-left text-sm shadow-[var(--shadow-lg)]"
        >
          <span className="flex items-center gap-2 text-muted"><Icon className="size-4" aria-hidden="true" />{meta.label}</span>
          <span className="mt-1 block font-semibold">{source.handle}</span>
          <span className="mt-1 block leading-relaxed text-ink">“{source.excerpt}”</span>
          <span className="mt-1 block text-muted">{source.likes.toLocaleString()} likes</span>
          <a href={source.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} className="mt-2 inline-flex min-h-11 items-center font-semibold text-cobalt">
            Open post<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </span>,
        document.body,
      )}
    </span>
  );
}

const STEPS = (query: string) => [
  `Finding posts about '${query}'…`,
  "Reading 312 reels, posts and comments…",
  "Writing a short summary with sources…",
];

function LoadingCard({ query, onStatus }: { query: string; onStatus: (s: string) => void }) {
  const reduced = useReducedMotion();
  const steps = STEPS(query || "this");
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduced) { onStatus(steps.join(" ")); return; }
    onStatus(steps[0]);
    const a = window.setTimeout(() => { setStep(1); onStatus(steps[1]); }, 600);
    const b = window.setTimeout(() => { setStep(2); onStatus(steps[2]); }, 1200);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [reduced, query]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-3xl border border-line bg-surface p-6" aria-busy="true">
      <div className="font-display text-2xl font-bold">What people say</div>
      <div className={`mt-4 space-y-2 ${reduced ? "" : "animate-pulse"}`} aria-hidden="true">
        <div className="h-4 w-full rounded-full bg-line" />
        <div className="h-4 w-11/12 rounded-full bg-line" />
        <div className="h-4 w-4/5 rounded-full bg-line" />
      </div>
      {reduced ? (
        <p className="mt-5 text-sm text-muted">Finding posts, reading them, and writing a short summary with sources.</p>
      ) : (
        <ol className="mt-5 space-y-2">
          {steps.map((text, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={text} className={`flex min-h-11 items-center gap-3 text-sm ${i > step ? "text-muted" : "text-ink"}`}>
                <span className={`grid size-6 shrink-0 place-items-center rounded-full ${done || current ? "bg-cobalt-soft text-cobalt" : "border border-line"}`} aria-hidden="true">
                  {done ? <Check className="size-3.5" /> : current ? <span className="size-2 rounded-full bg-cobalt" /> : null}
                </span>
                {text}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export function PulseTeaser({ story, onOpen }: { story: Story; onOpen: (cite?: number) => void }) {
  const pulse = useMemo(() => getStoryPulse(story), [story]);
  const first = pulse.sentences[0];
  const byN = new Map(pulse.sources.map((s) => [s.n, s]));
  return (
    <div className="mt-4 rounded-3xl border border-line bg-surface p-4">
      <p className="text-[17px] leading-relaxed">
        {first.text}
        {" "}
        {[...first.cites].sort((a, b) => a - b).map((n) => {
          const source = byN.get(n);
          return source ? <CiteChip key={n} source={source} onJump={(cite) => onOpen(cite)} /> : null;
        })}
      </p>
      <button type="button" onClick={() => onOpen()} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-cobalt hover:underline">
        See what people say
      </button>
    </div>
  );
}
