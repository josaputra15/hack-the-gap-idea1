# Pinwire — world news on a 3D map (prototype)

Tap a flag on the globe to read a country's news. Zoom in to see local, Snapchat-style story circles for cities. Every story has a plain-English headline, up/down votes, details, source, and comments.

> All news is **placeholder data** (`js/data.js`). Nothing is real yet.

## Run locally
No build step, no install. Any static server works:

```bash
npx serve .          # or: python3 -m http.server 8000
```
Open http://localhost:3000 (or :8000). Opening `index.html` directly from disk won't work because it uses ES modules.

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. In Vercel: **Add New → Project → Import** the repo.
3. Framework preset: **Other**. Leave build command and output directory empty.
4. Deploy. (`vercel.json` adds clean URLs, caching and security headers.)

Or from the terminal: `npx vercel` inside this folder.

## Project structure
```
index.html          App shell (map, panel, story viewer, article sheet)
terms.html          Terms of Service (template — get it reviewed before launch)
privacy.html        Privacy Policy (+ "delete my data" button)
accessibility.html  WCAG 2.2 AA statement
css/styles.css      All styles, dark + light themes, animations
js/app.js           Map, markers, panels, votes, comments, search, routing
js/data.js          Placeholder news  ← replace with a real API
vendor/             MapLibre GL JS 5 (bundled, no CDN needed)
assets/             Flags, favicon, offline world outline map
vercel.json         Vercel config
```

## How it works
- **Map:** MapLibre GL in globe projection with atmosphere. Tiles come from OpenFreeMap (free, no API key). If tiles can't load, it falls back to a bundled world outline so the app still works.
- **Zoom levels:** below zoom 4.2 you see country flags; above it you see local story circles plus a "heat" glow. Change `LOCAL_ZOOM` in `js/app.js`.
- **3D:** pitched camera when you fly into a city, plus 3D buildings at street level.
- **Votes, comments, theme, seen stories:** saved in `localStorage` (per browser). No backend yet.
- **Shareable links:** `#/c/jp` (country), `#/p/jp-tokyo` (local stories), `#/s/<story-id>` (article), `#/list`.

## Swapping in real news
Keep the shape `data.js` exports (`COUNTRIES`, each with `stories` and `places[].stories`). A story needs:
`id, category, headline (plain English), original, points[], why, body, source{name,url}, hoursAgo, score, comments[]`.
Good next steps: a small API route (Vercel Functions) that pulls from a news API, an LLM step to rewrite headlines in simple English, and a database (Supabase / Vercel Postgres) for shared votes and comments.

## Accessibility (WCAG 2.2 AA)
Skip link, full keyboard support (Tab/Enter/Esc, ←/→ and Space in stories), focus trapping in dialogs, list view as a non-map alternative, screen-reader labels and live regions, pause control for auto-advancing stories, `prefers-reduced-motion` support, AA contrast in both themes, 44px touch targets.

## Credits
Map © OpenStreetMap contributors · OpenFreeMap · MapLibre (BSD-3) · Flags: flag-icons (MIT) · Country shapes: Natural Earth via world-atlas (public domain).
