"use client";
import { motion, AnimatePresence } from "motion/react";
import { ArrowBigDown, ArrowBigUp, ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import type { Story } from "@/lib/data";
import { scoreOf, useUser, trustOf, reviewsOf } from "@/lib/store";
import { TAG_INDEX, TONE_STYLE } from "@/lib/tags";

export function Vote({ story, layout = "col", size = "md" }: { story: Story; layout?: "col" | "row"; size?: "md" | "lg" }) {
  const votes = useUser((s) => s.votes);
  const vote = useUser((s) => s.vote);
  const v = votes[story.id] || 0;
  const score = scoreOf(story, votes);
  const big = size === "lg";
  const btn = `grid place-items-center rounded-full transition active:scale-90 ${big ? "size-11" : "size-9"} hover:bg-ink/5`;
  return (
    <div
      role="group"
      aria-label="Vote on this story"
      className={`flex items-center ${layout === "col" ? "flex-col" : "flex-row gap-1 rounded-full bg-paper border border-line px-1"}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button aria-label="Upvote" aria-pressed={v === 1} onClick={() => vote(story.id, 1)} className={`${btn} ${v === 1 ? "text-up" : "text-muted"}`}>
        <ArrowBigUp className={big ? "size-6" : "size-5"} fill={v === 1 ? "currentColor" : "none"} strokeWidth={1.8} />
      </button>
      <span className={`relative overflow-hidden text-center font-semibold tabular-nums ${big ? "min-w-10 text-base" : "min-w-8 text-sm"}`} aria-live="polite">
        <span className="sr-only">Score </span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={score}
            className="inline-block"
            initial={{ y: v === -1 ? -12 : 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: v === -1 ? 12 : -12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {score}
          </motion.span>
        </AnimatePresence>
      </span>
      <button aria-label="Downvote" aria-pressed={v === -1} onClick={() => vote(story.id, -1)} className={`${btn} ${v === -1 ? "text-down" : "text-muted"}`}>
        <ArrowBigDown className={big ? "size-6" : "size-5"} fill={v === -1 ? "currentColor" : "none"} strokeWidth={1.8} />
      </button>
    </div>
  );
}

export function TagChip({ id, count, selected, onClick, size = "sm" }: { id: string; count?: number; selected?: boolean; onClick?: () => void; size?: "sm" | "md" }) {
  const t = TAG_INDEX.get(id);
  if (!t) return null;
  const base = `inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap transition ${size === "md" ? "px-3.5 min-h-10 text-sm" : "px-2.5 py-0.5 text-xs"}`;
  const style = onClick && !selected ? "bg-surface text-ink border-line hover:border-line-strong" : TONE_STYLE[t.tone];
  const content = (
    <>
      {t.label}
      {count !== undefined && <span className="opacity-70 tabular-nums">{count}</span>}
    </>
  );
  if (!onClick) return <span className={`${base} ${style}`}>{content}</span>;
  return (
    <motion.button type="button" whileTap={{ scale: 0.93 }} aria-pressed={!!selected} onClick={onClick} className={`${base} ${style} ${selected ? "ring-2 ring-offset-1 ring-current/30" : ""}`}>
      {content}
    </motion.button>
  );
}

/** Small trust badge used on cards */
export function TrustBadge({ story }: { story: Story }) {
  const mine = useUser((s) => s.myReviews);
  const t = trustOf(reviewsOf(story, mine));
  if (!t) return <span className="inline-flex items-center gap-1 text-xs text-muted"><Shield className="size-3.5" aria-hidden="true" />Not reviewed yet</span>;
  const good = t.pct >= 60;
  const Icon = good ? ShieldCheck : ShieldAlert;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${good ? "text-[var(--trust)]" : "text-[var(--warn)]"}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {t.pct}% trust<span className="text-muted font-normal">({t.n})</span>
    </span>
  );
}

export function Flag({ code, className = "" }: { code: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/flags/${code}.svg`} alt="" className={`object-cover ${className}`} />;
}
