/* Quick review tags. People tap these instead of (or as well as) writing a comment.
   tone: good = builds trust, warn = needs care, flag = report to moderators. */
export type QuickTag = { id: string; label: string; tone: "good" | "warn" | "flag"; emoji: string };

export const QUICK_TAGS: QuickTag[] = [
  // Builds trust
  { id: "well-sourced", label: "Well sourced", tone: "good", emoji: "📚" },
  { id: "confirmed", label: "Confirmed by other news", tone: "good", emoji: "✅" },
  { id: "easy", label: "Easy to understand", tone: "good", emoji: "🙂" },
  { id: "balanced", label: "Fair to all sides", tone: "good", emoji: "⚖️" },
  { id: "eyewitness", label: "I'm here — this is true", tone: "good", emoji: "📍" },
  { id: "important", label: "Important for locals", tone: "good", emoji: "⭐" },
  { id: "good-update", label: "Useful update", tone: "good", emoji: "🔄" },

  // Needs care
  { id: "gov-source", label: "Not reliable (government source)", tone: "warn", emoji: "🏛️" },
  { id: "misleading", label: "Misleading headline", tone: "warn", emoji: "🎣" },
  { id: "missing-context", label: "Missing context", tone: "warn", emoji: "🧩" },
  { id: "one-sided", label: "One-sided / biased", tone: "warn", emoji: "↔️" },
  { id: "outdated", label: "Outdated", tone: "warn", emoji: "⏳" },
  { id: "opinion", label: "Opinion, not news", tone: "warn", emoji: "💬" },
  { id: "unverified", label: "No proof yet", tone: "warn", emoji: "❓" },
  { id: "wrong-place", label: "Wrong location", tone: "warn", emoji: "🗺️" },
  { id: "bad-translation", label: "Bad translation", tone: "warn", emoji: "🔤" },
  { id: "paywall", label: "Source is behind a paywall", tone: "warn", emoji: "🔒" },
  { id: "ai-made", label: "Looks AI-generated", tone: "warn", emoji: "🤖" },

  // Report
  { id: "spam", label: "Spam", tone: "flag", emoji: "🚫" },
  { id: "fake", label: "False / fake news", tone: "flag", emoji: "❌" },
  { id: "clickbait", label: "Clickbait", tone: "flag", emoji: "🪝" },
  { id: "satire", label: "Satire or joke", tone: "flag", emoji: "🎭" },
  { id: "duplicate", label: "Duplicate story", tone: "flag", emoji: "📑" },
  { id: "hateful", label: "Hateful or offensive", tone: "flag", emoji: "⚠️" },
];

export const TAG_INDEX = new Map(QUICK_TAGS.map((t) => [t.id, t]));

export const TONE_STYLE: Record<QuickTag["tone"], string> = {
  good: "bg-[var(--trust-bg)] text-[var(--trust)] border-[var(--trust-line)]",
  warn: "bg-[var(--warn-bg)] text-[var(--warn)] border-[var(--warn-line)]",
  flag: "bg-[var(--flag-bg)] text-[var(--flag)] border-[var(--flag-line)]",
};

/* Quick comments: one tap posts a short comment. Grouped so the row reads well. */
export type QuickComment = { id: string; text: string; emoji: string; tone: "good" | "neutral" | "warn" | "flag" };

export const QUICK_COMMENTS: QuickComment[] = [
  // Report / warn
  { id: "q-spam", text: "Spam", emoji: "🚫", tone: "flag" },
  { id: "q-gov", text: "This is not reliable (government source)", emoji: "🏛️", tone: "warn" },
  { id: "q-fake", text: "This looks like fake news", emoji: "❌", tone: "flag" },
  { id: "q-clickbait", text: "Clickbait headline", emoji: "🪝", tone: "flag" },
  { id: "q-source", text: "Needs a better source", emoji: "🔎", tone: "warn" },
  { id: "q-confirmed", text: "Is this confirmed?", emoji: "❓", tone: "warn" },
  { id: "q-biased", text: "This feels one-sided", emoji: "↔️", tone: "warn" },
  { id: "q-old", text: "Old news", emoji: "⏳", tone: "warn" },
  { id: "q-wrongplace", text: "Wrong location", emoji: "🗺️", tone: "warn" },
  { id: "q-context", text: "Missing important context", emoji: "🧩", tone: "warn" },
  // Reactions
  { id: "q-thanks", text: "Thanks for sharing", emoji: "🙏", tone: "good" },
  { id: "q-great", text: "Great news!", emoji: "🎉", tone: "good" },
  { id: "q-clear", text: "Easy to understand, thanks", emoji: "🙂", tone: "good" },
  { id: "q-true", text: "I live here, this is true", emoji: "📍", tone: "good" },
  { id: "q-important", text: "This is important", emoji: "⭐", tone: "good" },
  { id: "q-affects", text: "This affects me", emoji: "🙋", tone: "neutral" },
  { id: "q-follow", text: "Following this story", emoji: "👀", tone: "neutral" },
  { id: "q-more", text: "I want more details", emoji: "📖", tone: "neutral" },
  { id: "q-sad", text: "Sad to hear this", emoji: "😢", tone: "neutral" },
  { id: "q-safe", text: "Stay safe, everyone", emoji: "💛", tone: "neutral" },
];

export const QUICK_COMMENT_INDEX = new Map(QUICK_COMMENTS.map((q) => [q.id, q]));

export const QUICK_TONE_STYLE: Record<QuickComment["tone"], string> = {
  good: "border-[var(--trust-line)] bg-[var(--trust-bg)] text-[var(--trust)]",
  neutral: "border-line bg-paper text-ink",
  warn: "border-[var(--warn-line)] bg-[var(--warn-bg)] text-[var(--warn)]",
  flag: "border-[var(--flag-line)] bg-[var(--flag-bg)] text-[var(--flag)]",
};
