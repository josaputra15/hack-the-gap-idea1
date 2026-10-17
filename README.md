# What's Going On In ____?

---
What's Going On In ___? is an interactive map-based news platform that helps people learn about any country or city through credibility-scored news, reviewed and flagged by the community from that region. Built by international students, it makes it easy to share your home country with friends and connect across cultures.
---

Tap a flag on the globe to read a country's news. Open the country **full screen** to browse, filter, vote and review. Zoom in to see local, Snapchat-style story circles for cities. Every story has a plain-English headline, up/down votes, details, its source, a **comment section** (replies, likes, report) with **one-tap quick comments** (like "Spam" or "This is not reliable (government source)"), and community reviews with a trust score.

> All news is **placeholder data** (`lib/raw.json`). Nothing is real yet.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Deploy to Vercel
Push to GitHub, then in Vercel choose **Add New → Project → Import**. Vercel detects Next.js automatically; no settings needed.

## Stack
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Motion (animations) · MapLibre GL (3D globe) · Zustand (state)

## Project structure
```
app/
  page.tsx               Home (the map app)
  terms/ privacy/ accessibility/   Legal pages
  globals.css            Colors, highlighter effect, map marker styles
components/
  Pinwire.tsx            App shell: top bar + search, URL/back-button sync, "All countries", welcome
  MapView.tsx            3D globe, flag pins, local story circles, fly-to
  CountryPanel.tsx       Country drawer ↔ full-screen view (sort, topic filter, cards)
  StoryModal.tsx         Story details, source, Comments tab, Reviews tab (trust scale + quick tags)
  Comments.tsx           Comment section: quick comments, write box, replies, likes, report
  StoryViewer.tsx        Snapchat-style local stories
  bits.tsx               Vote control, tag chips, trust badge, flag
lib/
  data.ts                Builds countries/places/stories from raw.json (+ sample reviews)
  raw.json               Placeholder news  ← replace with a real API
  tags.ts                Quick review tags and quick comments (add or rename them here)
  store.ts               Votes/reviews (saved in the browser) + navigation state
public/                  Flags and an offline world outline map
```

## How it works
- **Map:** MapLibre globe with OpenFreeMap "Positron" tiles (free, no API key). If tiles can't load it falls back to a bundled outline map.
- **Zoom levels:** below zoom 4.2 you see flags; above it you see local story circles. Change `LOCAL_ZOOM` in `components/MapView.tsx`.
- **Shareable URLs:** `?c=jp` (country), `?c=jp&view=full` (full screen), `?c=jp&p=jp-tokyo` (local stories), `?s=<story-id>` (a story). The browser Back button closes the top layer.
- **Votes and reviews** are saved in `localStorage` (per browser). There's no backend yet.

## Next steps
1. Replace `lib/raw.json` with an API route (`app/api/news/route.ts`) that pulls from a news API.
2. Use an LLM to rewrite headlines into simple English.
3. Store votes and reviews in a database (Supabase, Neon, or Vercel Postgres) so everyone sees them.
4. Add moderation for reports from the "Report it" tags.

## Accessibility (WCAG 2.2 AA)
Skip link, full keyboard support, focus trapping in dialogs, a list view as a non-map alternative, screen-reader labels and live regions, pause control for auto-advancing stories, `prefers-reduced-motion` support, AA contrast, trust shown with icons and words (not only color), and 44px touch targets.

## Myanmar real-news demo

Myanmar (`mm`) is the one country filled with real, linked reporting. Other countries stay placeholder stories.

- **Sources.** Each Myanmar story lists every outlet that covered it. The first source is the primary one. Local outlets use a blue pill. International outlets use a paper pill. A line above the list says how many local and international outlets covered it, for example "Covered by 2 international and 1 local outlet."
- **Refresh.** The country header polls `GET /api/news/mm` on open and then every 60 seconds. The request pauses while the tab is hidden and runs again when you come back. Live mode shows "Live · updated 12s ago". If the feeds cannot be reached, the pill says "Snapshot from Oct 16".
- **Fallback order.** Live RSS (Myanmar Now, The Irrawaddy, and Al Jazeera items that mention Myanmar) → `data/myanmar-feed.json` → the seed stories in `lib/myanmar.ts`. A feed link that matches a seed source keeps that seed's plain-English summary. Other feed links are shown as the outlet's original headline only.
- **Scrape.** `npm run scrape:mm` fetches those three feeds plus the Burma News International listing (`https://www.bnionline.net/en/news`, because BNI's RSS feed is stale). It checks `robots.txt`, waits one second between requests, and stores only headlines, links and dates in `data/myanmar-feed.json`.
- **`?demo=live`.** Presentation mode holds back the 3 newest real seed stories and reveals one per minute, as if they had just arrived. The published date and the source stay the real ones. Only the arrival is staged.

## Credits
Map © OpenStreetMap contributors · OpenFreeMap · MapLibre (BSD-3) · Flags: flag-icons (MIT) · Country shapes: Natural Earth (public domain).
