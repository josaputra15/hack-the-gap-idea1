"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Review, Story } from "./data";

/* ---------- User data (saved in this browser only) ---------- */
type UserState = {
  votes: Record<string, 1 | -1 | 0>;
  myReviews: Record<string, Review[]>;
  helpful: Record<string, boolean>;
  seen: string[];
  welcomed: boolean;
  vote: (id: string, v: 1 | -1) => void;
  addReview: (storyId: string, r: Review) => void;
  toggleHelpful: (reviewId: string) => void;
  markSeen: (placeId: string) => void;
  setWelcomed: () => void;
};

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      votes: {}, myReviews: {}, helpful: {}, seen: [], welcomed: false,
      vote: (id, v) => set((s) => ({ votes: { ...s.votes, [id]: s.votes[id] === v ? 0 : v } })),
      addReview: (storyId, r) => set((s) => ({ myReviews: { ...s.myReviews, [storyId]: [r, ...(s.myReviews[storyId] ?? [])] } })),
      toggleHelpful: (id) => set((s) => ({ helpful: { ...s.helpful, [id]: !s.helpful[id] } })),
      markSeen: (pid) => set((s) => (s.seen.includes(pid) ? s : { seen: [...s.seen, pid] })),
      setWelcomed: () => set({ welcomed: true }),
    }),
    { name: "pinwire-user", storage: createJSONStorage(() => localStorage) },
  ),
);

export const scoreOf = (s: Story, votes: UserState["votes"]) => s.score + (votes[s.id] || 0);
export const reviewsOf = (s: Story, mine: UserState["myReviews"]) => [...(mine[s.id] ?? []), ...s.reviews];

export function trustOf(reviews: Review[]) {
  if (!reviews.length) return null;
  const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
  return { avg, pct: Math.round(((avg - 1) / 4) * 100), n: reviews.length };
}

/* ---------- Navigation (mirrored to the URL so Back works) ---------- */
export type Nav = { country: string | null; full: boolean; story: string | null; place: string | null };
const EMPTY: Nav = { country: null, full: false, story: null, place: null };

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
  const q = p.toString();
  return q ? `?${q}` : location.pathname;
}
export function searchToNav(search: string): Nav {
  const p = new URLSearchParams(search);
  return { country: p.get("c"), full: p.get("view") === "full", place: p.get("p"), story: p.get("s") };
}
