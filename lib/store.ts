"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { PLACE_INDEX, type Comment, type Review, type Story } from "./data";

/* ---------- User data (saved in this browser only) ---------- */
type UserState = {
  votes: Record<string, 1 | -1 | 0>;
  myReviews: Record<string, Review[]>;
  helpful: Record<string, boolean>;
  myComments: Record<string, Comment[]>;
  likes: Record<string, boolean>;
  seen: string[];
  vote: (id: string, v: 1 | -1) => void;
  addReview: (storyId: string, r: Review) => void;
  toggleHelpful: (reviewId: string) => void;
  addComment: (storyId: string, c: Comment) => void;
  removeComment: (storyId: string, commentId: string) => void;
  toggleLike: (commentId: string) => void;
  markSeen: (placeId: string) => void;
};

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      votes: {}, myReviews: {}, helpful: {}, myComments: {}, likes: {}, seen: [],
      vote: (id, v) => set((s) => ({ votes: { ...s.votes, [id]: s.votes[id] === v ? 0 : v } })),
      addReview: (storyId, r) => set((s) => ({ myReviews: { ...s.myReviews, [storyId]: [r, ...(s.myReviews[storyId] ?? [])] } })),
      toggleHelpful: (id) => set((s) => ({ helpful: { ...s.helpful, [id]: !s.helpful[id] } })),
      addComment: (sid, c) => set((s) => ({ myComments: { ...s.myComments, [sid]: [...(s.myComments[sid] ?? []), c] } })),
      removeComment: (sid, cid) => set((s) => ({ myComments: { ...s.myComments, [sid]: (s.myComments[sid] ?? []).filter((c) => c.id !== cid) } })),
      toggleLike: (id) => set((s) => ({ likes: { ...s.likes, [id]: !s.likes[id] } })),
      markSeen: (pid) => set((s) => (s.seen.includes(pid) ? s : { seen: [...s.seen, pid] })),
    }),
    { name: "pinwire-user", storage: createJSONStorage(() => localStorage) },
  ),
);

export const scoreOf = (s: Story, votes: UserState["votes"]) => s.score + (votes[s.id] || 0);
export const reviewsOf = (s: Story, mine: UserState["myReviews"]) => [...(mine[s.id] ?? []), ...s.reviews];

export const commentsOf = (s: Story, mine: UserState["myComments"]) => [...s.comments, ...(mine[s.id] ?? [])];

export function trustOf(reviews: Review[]) {
  if (!reviews.length) return null;
  const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
  return { avg, pct: Math.round(((avg - 1) / 4) * 100), n: reviews.length };
}

/* ---------- Navigation (mirrored to the URL so Back works) ---------- */
export type StoryTab = "story" | "comments" | "reviews" | "pulse";
export type Nav = { country: string | null; full: boolean; story: string | null; place: string | null; tab?: StoryTab; ask?: string; demo?: string };
const EMPTY: Nav = { country: null, full: false, story: null, place: null, tab: undefined, ask: undefined };

type NavState = Nav & {
  go: (patch: Partial<Nav>) => void;
  replace: (n: Nav) => void;
  reset: () => void;
};

export const useNav = create<NavState>()((set) => ({
  ...EMPTY,
  go: (patch) => set(patch),
  replace: (n) => set(n),
  reset: () => set(EMPTY),
}));

export function navToSearch(n: Nav) {
  const p = new URLSearchParams();
  if (n.country) p.set("c", n.country);
  if (n.full) p.set("view", "full");
  if (n.place) p.set("p", n.place);
  if (n.story) p.set("s", n.story);
  if (n.story && n.tab && n.tab !== "story") p.set("t", n.tab);
  if (n.ask) p.set("ask", n.ask);
  if (n.demo) p.set("demo", n.demo);
  const q = p.toString();
  return q ? `?${q}` : location.pathname;
}
export function searchToNav(search: string): Nav {
  const p = new URLSearchParams(search);
  const t = p.get("t");
  const place = p.get("p");
  let story = p.get("s");
  let country = p.get("c");
  if (place && !story) {
    const found = PLACE_INDEX.get(place);
    if (found?.stories[0]) {
      story = found.stories[0].id;
      country = country ?? found.country;
    }
  }
  const ask = p.get("ask") || undefined;
  const demo = p.get("demo") || undefined;
  return { country, full: p.get("view") === "full", place, story, tab: t === "comments" || t === "reviews" || t === "pulse" ? t : undefined, ask, demo };
}
