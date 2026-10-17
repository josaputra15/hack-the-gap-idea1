/* Collect public headlines, links and dates for the Myanmar demo.
   Never stores article bodies. Waits 1 second between requests and skips
   any URL robots.txt disallows for this user agent.
   Run: npm run scrape:mm
*/
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { setTimeout as sleep } from "timers/promises";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { XMLParser } = require("fast-xml-parser");

const UA = "Whats Going On In demo (hackathon; headlines and links only)";
const FEEDS = [
  { url: "https://myanmar-now.org/en/feed/", outlet: "Myanmar Now", scope: "local" },
  { url: "https://www.irrawaddy.com/feed", outlet: "The Irrawaddy", scope: "local" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", outlet: "Al Jazeera", scope: "international", match: /myanmar|burma|rohingya|rakhine/i },
];
const BNI = "https://www.bnionline.net/en/news";

function asList(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}
function text(v) {
  if (typeof v === "string" || typeof v === "number") return String(v).trim();
  if (v && typeof v === "object") {
    if (typeof v["#text"] === "string") return v["#text"].trim();
    if (typeof v["@_href"] === "string") return v["@_href"].trim();
  }
  return "";
}
function decode(s) {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

async function allowed(url) {
  const u = new URL(url);
  const res = await fetch(new URL("/robots.txt", u.origin), { headers: { "User-Agent": UA } });
  if (!res.ok) return true;
  const groups = [];
  let group = { agents: [], disallow: [] };
  for (const line of (await res.text()).split(/\r?\n/)) {
    const clean = line.split("#")[0].trim();
    if (!clean) { if (group.agents.length) { groups.push(group); group = { agents: [], disallow: [] }; } continue; }
    const m = clean.match(/^(user-agent|disallow)\s*:\s*(.*)$/i);
    if (!m) continue;
    if (m[1].toLowerCase() === "user-agent") {
      if (group.disallow.length) { groups.push(group); group = { agents: [], disallow: [] }; }
      group.agents.push(m[2].trim().toLowerCase());
    } else group.disallow.push(m[2].trim());
  }
  if (group.agents.length) groups.push(group);
  const ua = UA.toLowerCase();
  const specific = groups.filter((g) => g.agents.some((a) => a !== "*" && ua.includes(a)));
  const rules = (specific.length ? specific : groups.filter((g) => g.agents.includes("*"))).flatMap((g) => g.disallow);
  return !rules.some((d) => d && u.pathname.startsWith(d));
}

async function get(url) {
  if (!(await allowed(url))) {
    console.log("skipped (robots.txt):", url);
    return "";
  }
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/html" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function fromRss(xml, feed) {
  if (!xml) return [];
  const doc = parser.parse(xml);
  const raw = asList(doc.rss?.channel?.item);
  const atom = asList(doc.feed?.entry);
  const nodes = raw.length ? raw : atom;
  const out = [];
  for (const node of nodes) {
    const title = decode(text(node.title));
    const link = text(node.link) || text(node.guid);
    const description = text(node.description) || text(node.summary);
    const when = Date.parse(text(node.pubDate) || text(node.published) || text(node.updated));
    if (!title || !link || Number.isNaN(when)) continue;
    if (feed.match && !feed.match.test(`${title} ${description}`)) continue;
    out.push({ title, url: link, outlet: feed.outlet, scope: feed.scope, publishedAt: new Date(when).toISOString() });
  }
  return out;
}

function fromBni(html) {
  if (!html) return [];
  const out = [];
  for (const card of html.split('class="card card-large"').slice(1)) {
    const date = card.match(/content="([^"]+)"/)?.[1];
    const title = card.match(/class="card-title"><a href="([^"]+)">([^<]+)</);
    const outlet = card.match(/card-category[\s\S]*?<a[^>]*>([^<]+)<\/a>/)?.[1];
    if (!date || !title) continue;
    out.push({
      title: decode(title[2].trim()),
      url: new URL(title[1], BNI).href,
      outlet: outlet ? decode(outlet.trim()) : "Burma News International (BNI)",
      scope: "local",
      publishedAt: new Date(date).toISOString(),
    });
  }
  return out;
}

const items = [];
for (const feed of FEEDS) {
  await sleep(1000);
  try { items.push(...fromRss(await get(feed.url), feed)); }
  catch (err) { console.error("feed failed:", feed.url, err.message); }
}
await sleep(1000);
try { items.push(...fromBni(await get(BNI))); }
catch (err) { console.error("BNI listing failed:", err.message); }

const seen = new Set();
const unique = items.filter((item) => {
  if (!item.title || !item.url || !item.publishedAt || seen.has(item.url)) return false;
  seen.add(item.url);
  return true;
});
const dir = path.join(process.cwd(), "data");
mkdirSync(dir, { recursive: true });
writeFileSync(path.join(dir, "myanmar-feed.json"), JSON.stringify(unique, null, 2));
console.log(`wrote ${unique.length} headlines to data/myanmar-feed.json`);
