"use client";
import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Reply, Flag as FlagIcon, Trash2, SendHorizontal, ChevronDown } from "lucide-react";
import type { Comment, Story } from "@/lib/data";
import { useUser, commentsOf, useNav } from "@/lib/store";
import { QUICK_COMMENTS, QUICK_COMMENT_INDEX, QUICK_TONE_STYLE } from "@/lib/tags";
import { toast } from "./Toast";

const AVATAR = ["#ffe25c", "#9fe3c0", "#b9ccff", "#ffc2d6", "#d8c6ff", "#ffcf9e"];
const agoLabel = (a: string) => (a === "now" ? "just now" : `${a} ago`);
const newId = () => `me-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/* ------------------------------------------------------------------
   Quick comments: one tap posts (tap again to take it back).
   Chips show how many people already said the same thing.
------------------------------------------------------------------- */
export function QuickComments({ story, limit, wrap = false, onDark = false }: { story: Story; limit?: number; wrap?: boolean; onDark?: boolean }) {
  const mine = useUser((s) => s.myComments);
  const add = useUser((s) => s.addComment);
  const remove = useUser((s) => s.removeComment);
  const all = commentsOf(story, mine);
  const myQuick = new Map((mine[story.id] ?? []).filter((c) => c.quick).map((c) => [c.quick!, c.id]));
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    all.forEach((c) => c.quick && m.set(c.quick, (m.get(c.quick) ?? 0) + 1));
    return m;
  }, [all]);

  // Stable order (chips don't jump when you tap): Spam and the government-source warning
  // always come first, then what other people used most on this story, then the rest.
  const ordered = useMemo(() => {
    const seeded = new Map<string, number>();
    story.comments.forEach((c) => c.quick && seeded.set(c.quick, (seeded.get(c.quick) ?? 0) + 1));
    const pinned = ["q-spam", "q-gov"];
    const rank = (id: string) => (pinned.includes(id) ? 100 - pinned.indexOf(id) : seeded.get(id) ?? 0);
    return [...QUICK_COMMENTS].sort((a, b) => rank(b.id) - rank(a.id));
  }, [story]);
  const list = limit ? ordered.slice(0, limit) : ordered;

  const tap = (id: string) => {
    const q = QUICK_COMMENT_INDEX.get(id)!;
    const existing = myQuick.get(id);
    if (existing) { remove(story.id, existing); toast("Quick comment removed"); return; }
    add(story.id, { id: newId(), name: "You", text: q.text, quick: id, ago: "now", likes: 0, mine: true });
    toast(q.tone === "flag" ? "Posted. Moderators will take a look." : "Comment posted");
  };

  return (
    <div
      role="group"
      aria-label="Quick comments. One tap posts a comment."
      className={wrap ? "flex flex-wrap gap-2" : "no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"}
    >
      {list.map((q) => {
        const on = myQuick.has(q.id);
        const n = counts.get(q.id) ?? 0;
        return (
          <motion.button
            key={q.id}
            type="button"
            whileTap={{ scale: 0.9 }}
            aria-pressed={on}
            onClick={(e) => { e.stopPropagation(); tap(q.id); }}
            className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition ${
              on ? `${QUICK_TONE_STYLE[q.tone]} ring-2 ring-current/25` : onDark ? "border-white/60 bg-white/70 text-ink hover:bg-white" : "border-line bg-surface text-ink hover:border-line-strong"
            }`}
          >
            {q.text}
            {n > 0 && <span className="tabular-nums opacity-70">{n}</span>}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------
   Write box (used for new comments and replies)
------------------------------------------------------------------- */
function Composer({ story, parent, onDone, autoFocus }: { story: Story; parent?: Comment; onDone?: () => void; autoFocus?: boolean }) {
  const add = useUser((s) => s.addComment);
  const [text, setText] = useState("");
  const id = useRef(`cm-${Math.random().toString(36).slice(2, 7)}`).current;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    add(story.id, { id: newId(), name: "You", text: t, ago: "now", likes: 0, mine: true, parent: parent?.id });
    setText("");
    toast(parent ? "Reply posted" : "Comment posted");
    onDone?.();
  };
  return (
    <form onSubmit={submit} className="flex items-end gap-2" onClick={(e) => e.stopPropagation()}>
      <label htmlFor={id} className="sr-only">{parent ? `Reply to ${parent.name}` : "Write a comment"}</label>
      <textarea
        id={id}
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e); } }}
        rows={1}
        maxLength={400}
        placeholder={parent ? `Reply to ${parent.name}…` : "Write a comment…"}
        className="max-h-40 min-h-11 flex-1 resize-none rounded-3xl border border-line bg-paper px-4 py-2.5 text-[15px] placeholder:text-muted focus:border-ink focus:bg-surface focus:outline-none [field-sizing:content]"
      />
      <motion.button
        type="submit"
        whileTap={{ scale: 0.9 }}
        disabled={!text.trim()}
        aria-label={parent ? "Post reply" : "Post comment"}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-cobalt text-white transition disabled:bg-line disabled:text-muted"
      >
        <SendHorizontal className="size-5" aria-hidden="true" />
      </motion.button>
    </form>
  );
}

/* ------------------------------------------------------------------
   One comment (+ its replies)
------------------------------------------------------------------- */
function CommentItem({ c, story, replies }: { c: Comment; story: Story; replies: Comment[] }) {
  const likes = useUser((s) => s.likes);
  const toggleLike = useUser((s) => s.toggleLike);
  const remove = useUser((s) => s.removeComment);
  const [replying, setReplying] = useState(false);
  const q = c.quick ? QUICK_COMMENT_INDEX.get(c.quick) : undefined;
  const liked = !!likes[c.id];
  const isReply = !!c.parent;

  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className={isReply ? "mt-3" : "border-t border-line py-4"}>
      <div className={`grid gap-3 ${isReply ? "grid-cols-[30px_1fr]" : "grid-cols-[38px_1fr]"}`}>
        <span
          className={`grid place-items-center rounded-full font-bold ${isReply ? "size-[30px] text-xs" : "size-[38px] text-sm"}`}
          style={{ background: c.mine ? "var(--ink)" : AVATAR[c.name.charCodeAt(0) % AVATAR.length], color: c.mine ? "#fff" : "var(--ink)" }}
          aria-hidden="true"
        >
          {c.name[0]}
        </span>
        <div className="min-w-0">
          <p className="text-sm">
            <span className="font-semibold">{c.name}</span>
            <span className="ml-2 text-muted">{agoLabel(c.ago)}</span>
          </p>
          {q ? (
            <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${QUICK_TONE_STYLE[q.tone]}`}>
              {q.text}
            </span>
          ) : (
            <p className="mt-0.5 text-[15px] leading-relaxed break-words">{c.text}</p>
          )}
          <div className="mt-1 -ml-2 flex flex-wrap items-center text-sm text-muted">
            <button aria-pressed={liked} onClick={() => toggleLike(c.id)} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 transition hover:bg-paper ${liked ? "text-down" : ""}`}>
              <motion.span key={String(liked)} initial={{ scale: liked ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 15 }}>
                <Heart className="size-4" fill={liked ? "currentColor" : "none"} aria-hidden="true" />
              </motion.span>
              <span className="tabular-nums">{c.likes + (liked ? 1 : 0) || ""}</span>
              <span className="sr-only">{liked ? "Unlike" : "Like"}</span>
            </button>
            {!isReply && (
              <button onClick={() => setReplying((r) => !r)} aria-expanded={replying} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 transition hover:bg-paper">
                <Reply className="size-4" aria-hidden="true" />Reply
              </button>
            )}
            {c.mine ? (
              <button onClick={() => { remove(story.id, c.id); toast("Comment deleted"); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 transition hover:bg-paper">
                <Trash2 className="size-4" aria-hidden="true" />Delete
              </button>
            ) : (
              <button onClick={() => toast("Thanks. A moderator will check this comment.")} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 transition hover:bg-paper">
                <FlagIcon className="size-4" aria-hidden="true" />Report
              </button>
            )}
          </div>
          {replies.length > 0 && (
            <ul className="border-l-2 border-line pl-3">
              <AnimatePresence initial={false}>{replies.map((r) => <CommentItem key={r.id} c={r} story={story} replies={[]} />)}</AnimatePresence>
            </ul>
          )}
          <AnimatePresence>
            {replying && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-2">
                <Composer story={story} parent={c} autoFocus onDone={() => setReplying(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.li>
  );
}

/* ------------------------------------------------------------------
   Full comment section (story page) or inline preview (cards)
------------------------------------------------------------------- */
export default function CommentSection({ story, variant = "full" }: { story: Story; variant?: "full" | "inline" }) {
  const mine = useUser((s) => s.myComments);
  const likes = useUser((s) => s.likes);
  const go = useNav((s) => s.go);
  const [order, setOrder] = useState<"top" | "new">("top");
  const [showQuick, setShowQuick] = useState(false);
  const all = commentsOf(story, mine);
  const topLevel = all.filter((c) => !c.parent);
  const repliesOf = (id: string) => all.filter((c) => c.parent === id);
  const age = (c: Comment) => (c.ago === "now" ? -1 : parseInt(c.ago) * (c.ago.endsWith("m") ? 1 : 60));
  const sorted = [...topLevel].sort((a, b) =>
    order === "new" ? age(a) - age(b) : b.likes + (likes[b.id] ? 1 : 0) + repliesOf(b.id).length * 2 - (a.likes + (likes[a.id] ? 1 : 0) + repliesOf(a.id).length * 2),
  );
  const inline = variant === "inline";
  const shown = inline ? [...topLevel].sort((a, b) => age(a) - age(b)).slice(0, 2) : sorted;

  return (
    <section aria-label={`Comments (${all.length})`} onClick={(e) => e.stopPropagation()}>
      {!inline && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h3 className="mr-auto font-display text-xl font-bold">Comments <span className="text-muted">({all.length})</span></h3>
          <div role="group" aria-label="Order comments" className="flex rounded-full bg-ink/[0.04] p-1 text-sm">
            {(["top", "new"] as const).map((o) => (
              <button key={o} aria-pressed={order === o} onClick={() => setOrder(o)} className={`min-h-8 rounded-full px-3 font-medium ${order === o ? "bg-surface shadow-[var(--shadow-sm)]" : "text-muted"}`}>
                {o === "top" ? "Top" : "Newest"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={inline ? "space-y-3" : "space-y-3 rounded-3xl bg-paper p-4"}>
        <p className="text-sm font-semibold">Quick comment <span className="font-normal text-muted">(one tap to post)</span></p>
        {inline || !showQuick ? <QuickComments story={story} limit={inline ? 8 : undefined} /> : <QuickComments story={story} wrap />}
        {!inline && (
          <button onClick={() => setShowQuick((x) => !x)} aria-expanded={showQuick} className="inline-flex items-center gap-1 text-sm font-medium text-cobalt">
            {showQuick ? "Show in one row" : `Show all ${QUICK_COMMENTS.length} quick comments`}
            <ChevronDown className={`size-4 transition ${showQuick ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        )}
        <Composer story={story} />
      </div>

      <ul className={inline ? "mt-2" : "mt-4"}>
        <AnimatePresence initial={false}>
          {shown.map((c) => <CommentItem key={c.id} c={c} story={story} replies={inline ? [] : repliesOf(c.id)} />)}
        </AnimatePresence>
        {!all.length && <li className="py-4 text-sm text-muted">No comments yet. Tap a quick comment or write the first one.</li>}
      </ul>

      {inline && all.length > shown.length && (
        <button onClick={() => go({ story: story.id, tab: "comments" })} className="mt-1 min-h-10 text-sm font-semibold text-cobalt hover:underline">
          View all {all.length} comments
        </button>
      )}
    </section>
  );
}
