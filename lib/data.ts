/* ------------------------------------------------------------------
   PLACEHOLDER NEWS DATA
   All stories live in raw.json and are made up for the prototype.
   Replace this module with a real API later; keep the exported types.
------------------------------------------------------------------- */
import raw from "./raw.json";
import { QUICK_TAGS, QUICK_COMMENTS } from "./tags";

type Tuple = [string, string, string, string, string, string];
type RawPlace = { name: string; at: [number, number]; stories: Tuple[] };
type RawCountry = { code: string; name: string; center: [number, number]; national: Tuple[]; places: RawPlace[] };

export type Comment = {
  id: string;
  name: string;
  text: string;
  ago: string; // "now", "5m", "3h"
  likes: number;
  quick?: string; // QuickComment id when posted with one tap
  parent?: string; // reply to another comment
  mine?: boolean;
};
export type Review = {
  id: string;
  name: string;
  rating: number; // 1–5, how trustworthy
  tags: string[]; // QuickTag ids
  text: string;
  ago: string;
  helpful: number;
  mine?: boolean;
};
export type Story = {
  id: string;
  category: string;
  headline: string;
  original: string;
  points: string[];
  why: string;
  body: string;
  source: { name: string; url: string; kind: "independent" | "government" | "wire" };
  hoursAgo: number;
  score: number;
  reviews: Review[];
  comments: Comment[];
  country: string;
  place: string | null;
  placeId: string | null;
  at: [number, number];
};
export type Place = { id: string; name: string; at: [number, number]; country: string; stories: Story[] };
export type Country = { code: string; name: string; center: [number, number]; places: Place[]; stories: Story[] };

export const EMOJI: Record<string, string> = {
  Economy: "📈", Science: "🔭", Transport: "🚆", Culture: "🎭", Weather: "🌦️", Tech: "💡",
  Environment: "🌿", Sport: "🏅", Food: "🍲", Politics: "🏛️", Health: "🩺", Energy: "⚡",
  Education: "🎓", Society: "🤝",
};

const SOURCES: { name: string; kind: Story["source"]["kind"] }[] = [
  { name: "Sample Wire", kind: "wire" },
  { name: "Placeholder Times", kind: "independent" },
  { name: "Example Daily", kind: "independent" },
  { name: "Ministry Press Office (sample)", kind: "government" },
  { name: "Demo Gazette", kind: "independent" },
  { name: "State Broadcaster (sample)", kind: "government" },
];

const NAMES = ["Ana", "Kofi", "Mei", "Lucas", "Priya", "Omar", "Sofia", "Jonas", "Aiko", "Diego", "Fatima", "Liam", "Nadia", "Tomás", "Chen", "Amara"];
const TEXTS_GOOD = [
  "Clear and simple. I checked another site and it says the same.",
  "Good summary — thanks for the plain English.",
  "I live nearby and this is accurate.",
  "Helpful. The 'why it matters' part explained it well.",
];
const TEXTS_BAD = [
  "This only quotes the government. I'd like an independent source too.",
  "The headline makes it sound bigger than it is.",
  "Missing important details — who pays for this?",
  "This is a few days old now.",
];

export function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

const GOOD_TAGS = QUICK_TAGS.filter((t) => t.tone === "good").map((t) => t.id);
const BAD_TAGS = QUICK_TAGS.filter((t) => t.tone !== "good").map((t) => t.id);

function makeReviews(id: string, gov: boolean): Review[] {
  const h = hash(id);
  const n = h % 6;
  return Array.from({ length: n }, (_, i) => {
    const r = hash(id + i);
    const positive = gov ? r % 3 === 0 : r % 4 !== 0;
    const tags = positive
      ? [GOOD_TAGS[r % GOOD_TAGS.length], ...(r % 2 ? [GOOD_TAGS[(r >> 3) % GOOD_TAGS.length]] : [])]
      : [gov && r % 2 ? "gov-source" : BAD_TAGS[r % BAD_TAGS.length]];
    return {
      id: `${id}-r${i}`,
      name: NAMES[r % NAMES.length],
      rating: positive ? 4 + (r % 2) : 1 + (r % 2),
      tags: [...new Set(tags)],
      text: (positive ? TEXTS_GOOD : TEXTS_BAD)[(r >> 2) % 4],
      ago: `${(r % 20) + 1}h`,
      helpful: r % 30,
    };
  });
}

const COMMENT_TEXTS = [
  "Does anyone know when this starts?",
  "Good to see this explained so simply.",
  "My family lives near there. Hoping it helps.",
  "I'd like to read the full report.",
  "Finally! This was needed for years.",
  "Interesting. I didn't know this.",
  "Who is paying for this?",
  "Shared this with my friends.",
];
const REPLY_TEXTS = ["Same question here.", "I think it starts next month.", "Agreed!", "Good point."];

function makeComments(id: string): Comment[] {
  const h = hash(id + "c");
  const n = h % 6;
  const out: Comment[] = [];
  for (let i = 0; i < n; i++) {
    const r = hash(id + "c" + i);
    const quick = r % 3 === 0 ? QUICK_COMMENTS[r % QUICK_COMMENTS.length] : undefined;
    const c: Comment = {
      id: `${id}-c${i}`,
      name: NAMES[(r >> 1) % NAMES.length],
      text: quick ? quick.text : COMMENT_TEXTS[r % COMMENT_TEXTS.length],
      quick: quick?.id,
      ago: `${(r % 20) + 1}h`,
      likes: r % 25,
    };
    out.push(c);
    if (!quick && r % 4 === 1) {
      const rr = hash(c.id + "r");
      out.push({ id: `${c.id}-r`, name: NAMES[rr % NAMES.length], text: REPLY_TEXTS[rr % REPLY_TEXTS.length], ago: `${(rr % 5) + 1}h`, likes: rr % 6, parent: c.id });
    }
  }
  return out;
}

function story(t: Tuple, ctx: { code: string; place?: string; placeId?: string; at: [number, number] }): Story {
  const [category, headline, original, p1, p2, why] = t;
  const id = (ctx.code + "-" + headline).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
  const h = hash(id);
  const src = SOURCES[h % SOURCES.length];
  return {
    id, category, headline, original, points: [p1, p2], why,
    body:
      `${p1} ${p2} This is placeholder text for the prototype. When the app is connected to a real news ` +
      `service, this space will hold a longer, easy-to-read summary of the original article, written in plain ` +
      `English with short sentences.`,
    source: { ...src, url: "https://example.com/news/" + id },
    hoursAgo: (h % 23) + 1,
    score: (h % 240) + 12,
    reviews: makeReviews(id, src.kind === "government"),
    comments: makeComments(id),
    country: ctx.code,
    place: ctx.place ?? null,
    placeId: ctx.placeId ?? null,
    at: ctx.at,
  };
}

export const COUNTRIES: Country[] = (raw as unknown as RawCountry[]).map((c) => {
  const places = c.places.map((p) => {
    const pid = c.code + "-" + p.name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-");
    return {
      id: pid, name: p.name, at: p.at, country: c.code,
      stories: p.stories.map((s) => story(s, { code: c.code, place: p.name, placeId: pid, at: p.at })),
    };
  });
  const national = c.national.map((s) => story(s, { code: c.code, at: c.center }));
  return { code: c.code, name: c.name, center: c.center, places, stories: [...national, ...places.flatMap((p) => p.stories)] };
});

export const STORY_INDEX = new Map(COUNTRIES.flatMap((c) => c.stories.map((s) => [s.id, s] as const)));
export const PLACE_INDEX = new Map(COUNTRIES.flatMap((c) => c.places.map((p) => [p.id, p] as const)));
export const COUNTRY_INDEX = new Map(COUNTRIES.map((c) => [c.code, c] as const));
export const CATEGORIES = [...new Set(COUNTRIES.flatMap((c) => c.stories.map((s) => s.category)))].sort();

export const APP_NAME = "What's Going On?";

/** Country names that take "the" in English ("the United States"). */
export function goingOnIn(name: string) {
  const place = name.startsWith("United ") ? `the ${name}` : name;
  return `What's going on in ${place}?`;
}

export const flagSrc = (code: string) => `/flags/${code}.svg`;
export const ago = (h: number) => (h < 1 ? "just now" : h === 1 ? "1 hour ago" : `${h} hours ago`);
