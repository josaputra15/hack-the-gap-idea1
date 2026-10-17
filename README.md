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

## Data sources

### Map
- **OpenStreetMap.** The base map data. © OpenStreetMap contributors. [openstreetmap.org/copyright](https://www.openstreetmap.org/copyright)
- **OpenFreeMap.** Serves the map tiles. The globe tries the Positron style, then Liberty: `https://tiles.openfreemap.org/styles/positron` and `https://tiles.openfreemap.org/styles/liberty`. No API key. Loading tiles can expose your IP address to that service.
- **OpenMapTiles.** Named in the map attribution on those styles.
- **MapLibre GL.** Draws the globe (BSD-3).
- **Natural Earth.** Country shapes in `public/countries.geojson` (public domain). Used to fill the selected country.
- **Offline outline.** If the tiles cannot load, the map falls back to a world outline bundled in `public/`.
- **flag-icons.** Country flags in `public/flags/`, from the lipis/flag-icons set (MIT). Myanmar’s flag is `public/flags/mm.svg`.

### News
- **Placeholder countries.** Stories in `lib/raw.json` are made up for the prototype. Their “Read original” links go to `example.com`.
- **Myanmar live feeds.** `GET /api/news/mm` fetches these RSS feeds about once a minute:
  - Myanmar Now: `https://myanmar-now.org/en/feed/`
  - The Irrawaddy: `https://www.irrawaddy.com/feed`
  - Al Jazeera: `https://www.aljazeera.com/xml/rss/all.xml` (only items that mention Myanmar, Burma, Rohingya, or Rakhine)
- **Myanmar scrape backup.** `npm run scrape:mm` reads those three feeds plus the Burma News International listing at `https://www.bnionline.net/en/news` (BNI’s own RSS feed is stale). It stores headlines, links, and dates in `data/myanmar-feed.json`. It does not store article text.
- **Myanmar snapshot.** `lib/myanmar.ts` is a fixed set of 16 real articles. Outlets named there include The Irrawaddy, Al Jazeera, Myanmar Now (including an AFP wire), and BNI member outlets: Karen Information Center, Development Media Group, Khonumthung News, Kachin News Group, Than Lwin Times, and Shan Herald Agency for News. Each story links to the original article.

### What people say
The “What people say” tab is demo data generated in the app. It does not call Instagram or any social network. Sample post links point at `example.com`.

## Terms, privacy, and accessibility

These match the pages in the app. Updated October 17, 2026. They are a prototype template, not legal advice.

In the running app those pages are `/terms`, `/privacy`, and `/accessibility`.

### Terms of Service

What's Going On In? is a prototype. This text is a starting template. Have a lawyer review it before a public launch.

1. **Agreeing to these terms.** By using What's Going On In? (the “Service”) you agree to these Terms. If you do not agree, do not use the Service.
2. **Who can use it.** You must be at least 13 years old, or the minimum age in your country.
3. **What this app is.** It shows short news summaries on a map, written in plain English. Summaries are based on reporting from other sources. Check the original source before you rely on a story for an important decision.
4. **Accuracy.** Stories are summaries, not the original reporting. The Service is provided “as is”, without warranties of any kind.
5. **Using the Service.** It is for reading news summaries. Do not use it to harass anyone, share illegal content, or disrupt the Service.
6. **Sources and links.** Stories link to outside websites. We do not control them and are not responsible for their content. Headlines and trademarks belong to their owners. A “government source” label describes who published a story. It is not a judgement of that government.
7. **Maps.** Map data © OpenStreetMap contributors, served by OpenFreeMap. Borders and names on the map do not show any political position by this app.
8. **Limitation of liability.** As far as the law allows, What's Going On In? is not liable for indirect or consequential losses from using the Service.
9. **Changes.** We may update these Terms. When we do, we change the date at the top. Using the Service after that means you accept the new Terms.
10. **Contact.** Questions: hello@example.com (placeholder).

### Privacy Policy

This prototype has no accounts and no server. What we remember stays only in your browser.

- **What we store.** Which local stories you have watched, so those circles can turn grey. This stays in your browser’s local storage. Nobody else can see it.
- **Third parties.** To draw the map, your browser loads map tiles from OpenFreeMap. Like any website request, that service can see your IP address.
- **Cookies.** What's Going On In? does not use tracking or advertising cookies.
- **Deleting your data.** Clear this site’s data in your browser settings, or use the button on the Privacy page.
- **Children.** What's Going On In? is not meant for children under 13.
- **Future versions.** If we add accounts or a server, we will update this policy before we collect any new data.

### Accessibility

We want everyone to be able to use What's Going On In?. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2, level AA.

- **No map needed.** “All countries” and search give you every story without the map. A skip link takes you straight there.
- **Keyboard.** Every flag, city circle, and button works with Tab, Enter, and Esc.
- **Screen readers.** Buttons have clear names, and important changes are announced.
- **Motion.** We follow your device’s “reduce motion” setting.
- **Contrast.** Text and controls meet AA contrast.
- **Plain English.** Headlines use simple words and short sentences.
- **Zoom and touch.** The layout works at 200% zoom and on small screens. Buttons are at least 44 pixels.
- **Known limits.** The map itself is visual. Use search or “All countries” for the same content without the map.
- **Feedback.** accessibility@example.com (placeholder).

## Credits
Map © OpenStreetMap contributors · OpenFreeMap · OpenMapTiles · MapLibre (BSD-3) · Flags: flag-icons (MIT) · Country shapes: Natural Earth (public domain).
