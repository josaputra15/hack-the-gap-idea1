/*
  GET /api/news/mm
  Refresh Myanmar headlines about once a minute.

  Order: live RSS → data/myanmar-feed.json (from `npm run scrape:mm`) → the seed
  snapshot in lib/myanmar.ts. A feed URL that matches a seed source reuses that
  seed's plain-English story. Anything else is headline-only: the outlet's real
  headline, date and link, with no summary we wrote.

  Presentation only: ?demo=live is handled in the browser (components/useLiveNews.ts).
  It holds back the 3 newest seed stories and reveals one per minute. Dates and
  sources stay real; only the moment they appear is staged.
*/

import { readFileSync, existsSync } from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import { NextResponse } from "next/server";
import { COUNTRY_INDEX, realStory, refreshAge, type SourceRef, type Story } from "@/lib/data";
import { MYANMAR } from "@/lib/myanmar";

export const revalidate = 60;

const UA = "Whats Going On In demo (hackathon; headlines and links only)";
const DAY = 24 * 60 * 60 * 1000;
const FEEDS: { url: string; outlet: string; scope: SourceRef["scope"]; kind: SourceRef["kind"]; match?: RegExp }[] = [
  { url: "https://myanmar-now.org/en/feed/", outlet: "Myanmar Now", scope: "local", kind: "independent" },
  { url: "https://www.irrawaddy.com/feed", outlet: "The Irrawaddy", scope: "local", kind: "independent" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", outlet: "Al Jazeera", scope: "international", kind: "independent", match: /myanmar|burma|rohingya|rakhine/i },
];

type Item = { title: string; url: string; publishedAt: string; outlet: string; scope: SourceRef["scope"]; kind: SourceRef["kind"] };

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function asList<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}
function text(v: unknown): string {
  if (typeof v === "string" || typeof v === "number") return String(v).trim();
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o["#text"] === "string") return o["#text"].trim();
    if (typeof o["@_href"] === "string") return o["@_href"].trim();
  }
  return "";
}
function normUrl(u: string) {
  try {
    const x = new URL(u);
    x.hash = "";
    const host = x.hostname.replace(/^www\./, "");
    return host + x.pathname.replace(/\/$/, "") + x.search;
  } catch {
    return u;
  }
}

function parseRss(xml: string, feed: (typeof FEEDS)[number]): Item[] {
  const doc = parser.parse(xml) as { rss?: { channel?: { item?: unknown } }; feed?: { entry?: unknown } };
  const rssItems = asList(doc.rss?.channel?.item);
  const atomItems = asList(doc.feed?.entry);
  const raw = rssItems.length ? rssItems : atomItems;
  const out: Item[] = [];
  for (const node of raw) {
    const row = node as Record<string, unknown>;
    const title = text(row.title).replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const link = text(row.link) || text(row.guid);
    const description = text(row.description) || text(row.summary) || text(row["content:encoded"]);
    const published = text(row.pubDate) || text(row.published) || text(row.updated) || text(row.date);
    const when = Date.parse(published);
    if (!title || !link || Number.isNaN(when)) continue;
    if (feed.match && !feed.match.test(`${title} ${description}`)) continue;
    out.push({ title, url: link, publishedAt: new Date(when).toISOString(), outlet: feed.outlet, scope: feed.scope, kind: feed.kind });
  }
  return out;
}

async function fetchFeed(feed: (typeof FEEDS)[number]): Promise<Item[]> {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" },
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(String(res.status));
  return parseRss(await res.text(), feed);
}

function readScraped(): Item[] {
  const file = path.join(process.cwd(), "data", "myanmar-feed.json");
  if (!existsSync(file)) return [];
  try {
    const json = JSON.parse(readFileSync(file, "utf8")) as Partial<Item>[];
    if (!Array.isArray(json)) return [];
    return json.flatMap((i) => {
      if (!i?.title || !i.url || !i.publishedAt) return [];
      const scope = i.scope === "international" ? "international" : "local";
      const kind = i.kind === "wire" || i.kind === "government" ? i.kind : "independent";
      return [{ title: i.title, url: i.url, publishedAt: i.publishedAt, outlet: i.outlet || "Myanmar Now", scope, kind }];
    });
  } catch {
    return [];
  }
}

function keepRecent(items: Item[]) {
  const cutoff = Date.now() - 14 * DAY;
  const seen = new Set<string>();
  return items
    .filter((i) => {
      const t = Date.parse(i.publishedAt);
      const key = normUrl(i.url);
      if (Number.isNaN(t) || t < cutoff || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 30);
}

function headlineOnly(item: Item): Story {
  const points = [
    `${item.outlet} published this story.`,
    "The lines below are sample text for the demo, not the full article.",
  ];
  const why = "Open the original link to read what the outlet reported.";
  const story = realStory({
    id: `mm-h-${item.url.length.toString(36)}-${Math.abs(hash(item.url)).toString(36)}`,
    category: "News",
    headline: item.title,
    original: item.title,
    points,
    why,
    sources: [{ outlet: item.outlet, url: item.url, scope: item.scope, kind: item.kind, publishedAt: item.publishedAt }],
    scope: item.scope,
    country: "mm",
    place: null,
    placeId: null,
    at: MYANMAR.center,
  });
  story.body =
    `${points[0]} ${points[1]} This is placeholder text for the prototype. When the app is connected to a real news ` +
    `service, this space will hold a longer, easy-to-read summary of the original article, written in plain English with short sentences.`;
  return story;
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h | 0;
}

function merge(items: Item[], now: number) {
  const seed = (COUNTRY_INDEX.get("mm")?.stories ?? []).map((s) => refreshAge(s, now));
  const byUrl = new Map<string, Story>();
  for (const story of seed) for (const src of story.sources ?? []) byUrl.set(normUrl(src.url), story);
  const extras: Story[] = [];
  for (const item of items) {
    if (byUrl.has(normUrl(item.url))) continue;
    extras.push(headlineOnly(item));
  }
  return [...seed, ...extras].sort((a, b) => a.hoursAgo - b.hoursAgo);
}

export async function GET(_req: Request, ctx: { params: Promise<{ country: string }> }) {
  const { country } = await ctx.params;
  if (country !== "mm") return NextResponse.json({ error: "No live feed for this country" }, { status: 404 });

  const now = Date.now();
  const results = await Promise.all(FEEDS.map((feed) => fetchFeed(feed).then(
    (items) => ({ ok: true as const, items }),
    () => ({ ok: false as const, items: [] as Item[] }),
  )));
  const liveOk = results.some((r) => r.ok);
  const items = keepRecent(liveOk ? results.flatMap((r) => r.items) : readScraped());
  return NextResponse.json({
    mode: liveOk ? "live" : "snapshot",
    fetchedAt: new Date(now).toISOString(),
    stories: merge(items, now),
  });
}
