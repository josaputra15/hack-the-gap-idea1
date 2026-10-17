"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Share2, ExternalLink, Landmark, Newspaper, Radio, ThumbsUp, Flag as FlagIcon, ShieldCheck, ShieldAlert, MessageCircle } from "lucide-react";
import { STORY_INDEX, COUNTRY_INDEX, ago, type Story, type Review } from "@/lib/data";
import { useNav, useUser, reviewsOf, trustOf, commentsOf, type StoryTab } from "@/lib/store";
import CommentSection from "./Comments";
import { QUICK_TAGS } from "@/lib/tags";
import { Vote, TagChip, Flag } from "./bits";
import { useDialog } from "./useDialog";
import { toast } from "./Toast";

export default function StoryModal() {
  const id = useNav((s) => s.story);
  const go = useNav((s) => s.go);
  const s = id ? STORY_INDEX.get(id) : undefined;
  const close = () => go({ story: null, tab: undefined });
  const ref = useDialog<HTMLDivElement>(!!s, close);
  const tab: StoryTab = useNav((st) => st.tab) ?? "story";
  const setTab = (t: StoryTab) => go({ tab: t === "story" ? undefined : t });
  const order: StoryTab[] = ["story", "comments", "reviews"];
  const dir = useRef(0);
  const prevTab = useRef(tab);
  if (prevTab.current !== tab) { dir.current = order.indexOf(tab) > order.indexOf(prevTab.current) ? 1 : -1; prevTab.current = tab; }
  useEffect(() => { ref.current?.querySelector(".overflow-y-auto")?.scrollTo({ top: 0 }); }, [tab, ref]);
  useEffect(() => { if (s) ref.current?.querySelector<HTMLElement>("#story-title")?.focus({ preventScroll: true }); }, [s, ref]);

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
            <Head s={s} tab={tab} setTab={setTab} onClose={close} />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: dir.current * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir.current * -24 }}
                  transition={{ duration: 0.2 }}
                  className="px-6 pb-10 pt-2 md:px-9"
                >
                  {tab === "story" && <StoryTab s={s} toReviews={() => setTab("reviews")} toComments={() => setTab("comments")} />}
                  {tab === "comments" && <div className="pt-6"><CommentSection story={s} /></div>}
                  {tab === "reviews" && <ReviewsTab s={s} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Head({ s, tab, setTab, onClose }: { s: Story; tab: StoryTab; setTab: (t: StoryTab) => void; onClose: () => void }) {
  const mine = useUser((st) => st.myReviews);
  const myC = useUser((st) => st.myComments);
  const n = reviewsOf(s, mine).length;
  const nc = commentsOf(s, myC).length;
  const c = COUNTRY_INDEX.get(s.country)!;
  return (
    <div className="border-b border-line px-6 pt-5 md:px-9">
      <div className="mb-3 flex items-center gap-2 text-sm text-muted">
        <Flag code={c.code} className="h-[18px] w-6 rounded-[3px]" />
        <span>{s.place ? `${s.place}, ${c.name}` : c.name}</span>
        <span aria-hidden="true">/</span>
        <span>{ago(s.hoursAgo)}</span>
        <button onClick={onClose} aria-label="Close story" className="ml-auto -mr-2 grid size-11 place-items-center rounded-full text-ink transition hover:bg-ink/5 active:scale-90">
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div role="tablist" aria-label="Story sections" className="no-scrollbar flex gap-6 overflow-x-auto">
        {(["story", "comments", "reviews"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`relative min-h-11 shrink-0 pb-3 text-[15px] font-semibold transition ${tab === t ? "text-ink" : "text-muted hover:text-ink"}`}>
            {t === "story" ? "The story" : t === "comments" ? `Comments (${nc})` : `Reviews (${n})`}
            {tab === t && <motion.span layoutId="story-tab" className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-ink" />}
          </button>
        ))}
      </div>
    </div>
  );
}

const SOURCE_ICON = { government: Landmark, independent: Newspaper, wire: Radio };
const SOURCE_LABEL = { government: "Government source", independent: "Independent outlet", wire: "News agency" };

function StoryTab({ s, toReviews, toComments }: { s: Story; toReviews: () => void; toComments: () => void }) {
  const mine = useUser((st) => st.myReviews);
  const myC = useUser((st) => st.myComments);
  const nc = commentsOf(s, myC).length;
  const t = trustOf(reviewsOf(s, mine));
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
    <article>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-paper px-2.5 py-1 font-medium">{s.category}</span>
        <span className="rounded-full border border-dashed border-line-strong px-2.5 py-1 text-muted">Sample story, not real news</span>
      </div>
      <h2 id="story-title" tabIndex={-1} className="mt-4 font-display text-[34px] font-bold leading-[1.05] md:text-[44px]">
        <span className={`mark ${marked ? "on" : ""}`}>{s.headline}</span>
      </h2>
      <p className="mt-3 text-sm text-muted">Original headline: <span className="text-ink">{s.original}</span></p>

      <div className="my-6 flex flex-wrap items-center gap-2">
        <Vote story={s} layout="row" size="lg" />
        <button onClick={toReviews} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition hover:brightness-95 ${t ? (t.pct >= 60 ? "border-[var(--trust-line)] bg-[var(--trust-bg)] text-[var(--trust)]" : "border-[var(--warn-line)] bg-[var(--warn-bg)] text-[var(--warn)]") : "border-line bg-paper"}`}>
          {t && t.pct < 60 ? <ShieldAlert className="size-4" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
          {t ? `${t.pct}% trust from ${t.n} reviews` : "Be the first to review"}
        </button>
        <button onClick={share} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold transition hover:bg-paper">
          <Share2 className="size-4" aria-hidden="true" />Share
        </button>
        <button onClick={toComments} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold transition hover:bg-paper">
          <MessageCircle className="size-4" aria-hidden="true" />{nc} comments
        </button>
      </div>

      <section className="rounded-2xl bg-paper p-5" aria-labelledby="short-h">
        <h3 id="short-h" className="mb-2 font-display text-lg font-bold">In short</h3>
        <ul className="list-disc space-y-1 pl-5 text-[17px] leading-relaxed">{s.points.map((p) => <li key={p}>{p}</li>)}</ul>
      </section>
      <section className="mt-4 rounded-2xl border-l-4 border-mark bg-[#fffbe8] p-5" aria-labelledby="why-h">
        <h3 id="why-h" className="mb-1 font-display text-lg font-bold">Why it matters</h3>
        <p className="text-[17px] leading-relaxed">{s.why}</p>
      </section>
      <h3 className="mt-8 mb-2 font-display text-xl font-bold">What happened</h3>
      <p className="max-w-[65ch] text-[17px] leading-[1.75]">{s.body}</p>

      <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-line p-4">
        <span className={`grid size-12 place-items-center rounded-xl ${s.source.kind === "government" ? "bg-[var(--warn-bg)] text-[var(--warn)]" : "bg-cobalt-soft text-cobalt"}`}>
          <SrcIcon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{s.source.name}</p>
          <p className="text-sm text-muted">{SOURCE_LABEL[s.source.kind]}{s.source.kind === "government" && ": check other sources too"}</p>
        </div>
        <a href={s.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-ink/90">
          Read original<ExternalLink className="size-4" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>

      <section className="mt-10 border-t border-line pt-8" aria-label="Comments preview">
        <CommentSection story={s} variant="inline" />
        <button onClick={toComments} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white">
          <MessageCircle className="size-4" aria-hidden="true" />Open the comment section
        </button>
      </section>
    </article>
  );
}

/* ---------------- Reviews ---------------- */
const SCALE = [
  { v: 1, label: "Not at all" },
  { v: 2, label: "A little" },
  { v: 3, label: "Not sure" },
  { v: 4, label: "Mostly" },
  { v: 5, label: "Very" },
];
const GROUPS = [
  { tone: "good", title: "Builds trust" },
  { tone: "warn", title: "Needs care" },
  { tone: "flag", title: "Report it" },
] as const;

function ReviewsTab({ s }: { s: Story }) {
  const mine = useUser((st) => st.myReviews);
  const helpful = useUser((st) => st.helpful);
  const all = reviewsOf(s, mine);
  const t = trustOf(all);
  const [filter, setFilter] = useState<string | null>(null);
  const [order, setOrder] = useState<"helpful" | "new">("helpful");

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    all.forEach((r) => r.tags.forEach((x) => m.set(x, (m.get(x) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);
  const dist = [5, 4, 3, 2, 1].map((v) => ({ v, n: all.filter((r) => r.rating === v).length }));
  const shown = all
    .filter((r) => !filter || r.tags.includes(filter))
    .sort((a, b) => (order === "new" ? Number(!!b.mine) - Number(!!a.mine) || parseInt(a.ago) - parseInt(b.ago) : b.helpful + (helpful[b.id] ? 1 : 0) - (a.helpful + (helpful[a.id] ? 1 : 0))));

  return (
    <div className="pt-4">
      {/* Summary */}
      <section aria-labelledby="sum-h" className="grid gap-5 rounded-2xl bg-paper p-5 sm:grid-cols-[160px_1fr]">
        <div>
          <h3 id="sum-h" className="text-sm text-muted">Community trust</h3>
          <p className="font-display text-5xl font-bold leading-none">{t ? `${t.pct}%` : "–"}</p>
          <p className="mt-1 text-sm text-muted">{t ? `from ${t.n} reviews` : "No reviews yet"}</p>
        </div>
        <ul className="space-y-1.5" aria-label="How people rated it">
          {dist.map(({ v, n }) => (
            <li key={v} className="grid grid-cols-[88px_1fr_24px] items-center gap-2 text-sm">
              <span className="text-muted">{SCALE[v - 1].label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-line">
                <motion.span className="block h-full rounded-full bg-ink" initial={{ width: 0 }} animate={{ width: all.length ? `${(n / all.length) * 100}%` : 0 }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
              </span>
              <span className="text-right tabular-nums text-muted">{n}</span>
            </li>
          ))}
        </ul>
      </section>

      <ReviewForm s={s} />

      {/* List */}
      <section aria-labelledby="list-h" className="mt-10">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 id="list-h" className="mr-auto font-display text-xl font-bold">All reviews</h3>
          <div role="group" aria-label="Order reviews" className="flex rounded-full bg-ink/[0.04] p-1 text-sm">
            {(["helpful", "new"] as const).map((o) => (
              <button key={o} aria-pressed={order === o} onClick={() => setOrder(o)} className={`min-h-8 rounded-full px-3 font-medium ${order === o ? "bg-surface shadow-[var(--shadow-sm)]" : "text-muted"}`}>
                {o === "helpful" ? "Most helpful" : "Newest"}
              </button>
            ))}
          </div>
        </div>
        {counts.length > 0 && (
          <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter reviews by quick review">
            {counts.map(([id, n]) => <TagChip key={id} id={id} count={n} selected={filter === id} onClick={() => setFilter(filter === id ? null : id)} />)}
          </div>
        )}
        <ul>
          <AnimatePresence initial={false}>
            {shown.map((r) => <ReviewItem key={r.id} r={r} />)}
          </AnimatePresence>
          {!shown.length && <li className="py-6 text-muted">No reviews match. Clear the filter or write the first one.</li>}
        </ul>
      </section>
    </div>
  );
}

function ReviewForm({ s }: { s: Story }) {
  const add = useUser((st) => st.addReview);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const toggle = (id: string) => setTags((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { setErr("Choose how trustworthy this story is."); return; }
    if (!tags.length && !text.trim()) { setErr("Tap at least one quick review or write a comment."); return; }
    add(s.id, { id: `me-${Date.now()}`, name: name.trim() || "You", rating, tags, text: text.trim(), ago: "now", helpful: 0, mine: true });
    setRating(0); setTags([]); setText(""); setErr("");
    toast(tags.some((t) => QUICK_TAGS.find((q) => q.id === t)?.tone === "flag") ? "Review posted. Moderators will check your report." : "Review posted");
  };

  return (
    <form onSubmit={submit} className="mt-8" noValidate aria-labelledby="form-h">
      <h3 id="form-h" className="font-display text-xl font-bold">Write a review</h3>

      <fieldset className="mt-4">
        <legend className="mb-2 text-[15px] font-semibold">How much do you trust this story?</legend>
        <div className="grid grid-cols-5 gap-2">
          {SCALE.map((o) => (
            <motion.button
              key={o.v}
              type="button"
              whileTap={{ scale: 0.92 }}
              aria-pressed={rating === o.v}
              onClick={() => { setRating(o.v); setErr(""); }}
              className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border text-xs font-medium transition ${rating === o.v ? "border-ink bg-ink text-white" : "border-line hover:border-line-strong"}`}
            >
              <span className="text-base font-bold">{o.v}</span>{o.label}
            </motion.button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="mb-1 text-[15px] font-semibold">Quick review <span className="font-normal text-muted">(tap any that fit)</span></legend>
        {GROUPS.map((g) => (
          <div key={g.tone} className="mt-3">
            <p className="mb-1.5 text-sm text-muted">{g.title}</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.filter((q) => q.tone === g.tone).map((q) => (
                <TagChip key={q.id} id={q.id} size="md" selected={tags.includes(q.id)} onClick={() => { toggle(q.id); setErr(""); }} />
              ))}
            </div>
          </div>
        ))}
      </fieldset>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_200px]">
        <div>
          <label htmlFor="rv-text" className="mb-1 block text-[15px] font-semibold">Comment <span className="font-normal text-muted">(optional)</span></label>
          <textarea id="rv-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={400} rows={3} aria-describedby="rv-count" placeholder="What should others know?" className="w-full resize-y rounded-2xl border border-line bg-paper px-4 py-3 text-[15px] placeholder:text-muted focus:border-ink focus:outline-none" />
          <p id="rv-count" className="mt-1 text-right text-xs text-muted">{text.length} / 400</p>
        </div>
        <div>
          <label htmlFor="rv-name" className="mb-1 block text-[15px] font-semibold">Name <span className="font-normal text-muted">(optional)</span></label>
          <input id="rv-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="nickname" className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-[15px] focus:border-ink focus:outline-none" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" className="inline-flex min-h-12 items-center rounded-full bg-cobalt px-6 font-semibold text-white transition hover:brightness-110 active:scale-95">Post review</button>
        <p role="alert" className="text-sm font-medium text-down">{err}</p>
        <p className="w-full text-xs text-muted">Be kind and follow the <a href="/terms#community" className="underline">community rules</a>.</p>
      </div>
    </form>
  );
}

const AVATAR = ["#ffe25c", "#9fe3c0", "#b9ccff", "#ffc2d6", "#d8c6ff", "#ffcf9e"];

function ReviewItem({ r }: { r: Review }) {
  const helpful = useUser((s) => s.helpful);
  const toggle = useUser((s) => s.toggleHelpful);
  const on = !!helpful[r.id];
  return (
    <motion.li layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-[40px_1fr] gap-3 border-t border-line py-4">
      <span className="grid size-10 place-items-center rounded-full font-bold" style={{ background: AVATAR[r.name.charCodeAt(0) % AVATAR.length] }} aria-hidden="true">{r.name[0]}</span>
      <div className="min-w-0">
        <p className="text-sm">
          <span className="font-semibold">{r.name}</span>
          {r.mine && <span className="ml-2 rounded-full bg-cobalt-soft px-2 py-0.5 text-xs font-medium text-cobalt">You</span>}
          <span className="ml-2 text-muted">{r.ago === "now" ? "just now" : `${r.ago} ago`}</span>
        </p>
        <p className="mt-0.5 text-sm text-muted">Trust: <span className="font-medium text-ink">{SCALE[r.rating - 1].label}</span></p>
        {r.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{r.tags.map((t) => <TagChip key={t} id={t} />)}</div>}
        {r.text && <p className="mt-2 text-[15px] leading-relaxed">{r.text}</p>}
        <div className="mt-2 flex gap-1 text-sm">
          <button aria-pressed={on} onClick={() => toggle(r.id)} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 transition ${on ? "bg-cobalt-soft text-cobalt" : "text-muted hover:bg-paper"}`}>
            <ThumbsUp className="size-4" aria-hidden="true" fill={on ? "currentColor" : "none"} />Helpful {r.helpful + (on ? 1 : 0) || ""}
          </button>
          {!r.mine && (
            <button onClick={() => toast("Thanks. A moderator will check this review.")} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-muted transition hover:bg-paper">
              <FlagIcon className="size-4" aria-hidden="true" />Report
            </button>
          )}
        </div>
      </div>
    </motion.li>
  );
}
