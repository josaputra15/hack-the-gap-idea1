import { COUNTRIES, STORY_INDEX, PLACE_INDEX, COUNTRY_INDEX } from "./data.js";

/* =========================================================
   Config
   ========================================================= */
const LOCAL_ZOOM = 4.2;          // above this zoom, show local story bubbles instead of flags
const STORY_MS = 7000;           // how long each story shows in the viewer
const MAP_STYLES = {             // free, no-key vector tiles (OpenFreeMap). Falls back to a local outline map.
  dark: ["https://tiles.openfreemap.org/styles/dark", "https://tiles.openfreemap.org/styles/liberty"],
  light: ["https://tiles.openfreemap.org/styles/liberty"],
};
const EMOJI = {
  Economy: "📈", Science: "🔭", Transport: "🚆", Culture: "🎭", Weather: "🌦️", Tech: "💡",
  Environment: "🌿", Sport: "🏅", Food: "🍲", Politics: "🏛️", Health: "🩺", Energy: "⚡",
  Education: "🎓", Society: "🤝",
};
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, el = document) => el.querySelector(s);
const flag = (code) => `assets/flags/${code}.svg`;
const isMobile = () => matchMedia("(max-width: 720px)").matches;

/* =========================================================
   Local storage (votes, comments, seen places, prefs)
   ========================================================= */
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem("pw-" + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("pw-" + k, JSON.stringify(v)); } catch {} },
};
const votes = store.get("votes", {});
const userComments = store.get("comments", {});
const seen = new Set(store.get("seen", []));

const scoreOf = (s) => s.score + (votes[s.id] || 0);
const commentsOf = (s) => [...(userComments[s.id] || []), ...s.comments];

function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2400);
}
const ago = (h) => (h < 1 ? "just now" : h === 1 ? "1 hour ago" : `${h} hours ago`);

/* =========================================================
   Map
   ========================================================= */
const theme = () => document.documentElement.dataset.theme === "light" ? "light" : "dark";

function fallbackStyle() {
  const light = theme() === "light";
  return {
    version: 8,
    sources: { countries: { type: "geojson", data: "assets/countries.geojson" } },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": light ? "#b9d3ee" : "#0b1730" } },
      { id: "land", type: "fill", source: "countries", paint: { "fill-color": light ? "#f6f3ec" : "#1c2740" } },
      { id: "borders", type: "line", source: "countries", paint: { "line-color": light ? "#c3c9d4" : "#33415e", "line-width": 0.8 } },
    ],
  };
}

async function pickStyle() {
  for (const url of MAP_STYLES[theme()]) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (r.ok) return url;
    } catch {}
  }
  return fallbackStyle();
}

let map;
let usingRemote = false;
const countryMarkers = [];
const placeMarkers = [];

async function initMap() {
  const style = await pickStyle();
  usingRemote = typeof style === "string";
  map = new maplibregl.Map({
    container: "map",
    style,
    center: [15, 22],
    zoom: isMobile() ? 0.9 : 1.6,
    minZoom: 0.6,
    maxZoom: 17,
    attributionControl: { compact: true },
    renderWorldCopies: false,
  });
  map.keyboard.enable();
  map.on("style.load", decorateStyle);
  map.on("zoom", updateLevel);
  map.on("load", () => {
    addMarkers();
    updateLevel();
    startSpin();
    handleDeepLink();
  });
  ["mousedown", "touchstart", "wheel", "dragstart"].forEach((e) => map.on(e, stopSpin));
  $("#map").addEventListener("keydown", stopSpin);
}

function decorateStyle() {
  try { map.setProjection({ type: "globe" }); } catch {}
  const light = theme() === "light";
  try {
    map.setSky({
      "sky-color": light ? "#cfe0f7" : "#0a0e17",
      "horizon-color": light ? "#ffffff" : "#2a4a8a",
      "fog-color": light ? "#eef1f6" : "#0a0e17",
      "sky-horizon-blend": 0.6,
      "horizon-fog-blend": 0.6,
      "fog-ground-blend": 0.4,
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 5, 1, 7, 0],
    });
  } catch {}

  // 3D buildings when zoomed in (only with real vector tiles)
  const src = map.getStyle().sources;
  const hasExtrusion = map.getStyle().layers.some((l) => l.type === "fill-extrusion");
  if (src.openmaptiles && !hasExtrusion) {
    try {
      map.addLayer({
        id: "pw-buildings", type: "fill-extrusion", source: "openmaptiles", "source-layer": "building", minzoom: 14,
        paint: {
          "fill-extrusion-color": light ? "#e3e6ec" : "#26314a",
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 10],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.85,
        },
      });
    } catch {}
  }

  // "Heat" glow where local stories are (Snap Map style)
  const points = {
    type: "FeatureCollection",
    features: COUNTRIES.flatMap((c) => c.places.map((p) => ({
      type: "Feature", properties: { w: p.stories.length }, geometry: { type: "Point", coordinates: p.at },
    }))),
  };
  if (!map.getSource("pw-heat")) map.addSource("pw-heat", { type: "geojson", data: points });
  if (!map.getLayer("pw-heat")) {
    map.addLayer({
      id: "pw-heat", type: "heatmap", source: "pw-heat", minzoom: 2.5, maxzoom: 12,
      paint: {
        "heatmap-weight": ["/", ["get", "w"], 2],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 3, 1, 9, 2],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 30, 9, 90],
        "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 2.5, 0, 4, 0.75, 11, 0.4, 12, 0],
        "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"],
          0, "rgba(0,0,0,0)", 0.2, "rgba(138,92,255,0.35)", 0.5, "rgba(255,61,139,0.55)",
          0.8, "rgba(255,107,61,0.7)", 1, "rgba(255,211,77,0.85)"],
      },
    });
  }
}

function addMarkers() {
  COUNTRIES.forEach((c, i) => {
    const el = document.createElement("button");
    el.className = "pin";
    el.style.setProperty("--d", `${0.3 + i * 0.05}s`);
    el.setAttribute("aria-label", `${c.name}: ${c.stories.length} stories. Open country news.`);
    el.innerHTML = `
      <span class="pulse" aria-hidden="true"></span>
      <span class="bubble"><img src="${flag(c.code)}" alt="" /></span>
      <span class="count" aria-hidden="true">${c.stories.length}</span>
      <span class="label" aria-hidden="true">${esc(c.name)}</span>`;
    el.addEventListener("click", (e) => { e.stopPropagation(); openCountry(c.code, { fly: true }); });
    countryMarkers.push(new maplibregl.Marker({ element: el, anchor: "bottom", opacityWhenCovered: "0" }).setLngLat(c.center).addTo(map));
  });

  COUNTRIES.forEach((c) => c.places.forEach((p, i) => {
    const el = placeBubble(p, i);
    el.addEventListener("click", (e) => { e.stopPropagation(); openViewer(p.id, { fly: true }); });
    placeMarkers.push(new maplibregl.Marker({ element: el, anchor: "center", opacityWhenCovered: "0" }).setLngLat(p.at).addTo(map));
  }));
}

function placeBubble(p, i = 0) {
  const el = document.createElement("button");
  el.className = "local" + (seen.has(p.id) ? " seen" : "");
  el.dataset.place = p.id;
  el.style.setProperty("--d", `${i * 0.06}s`);
  el.setAttribute("aria-label", `${p.name}: ${p.stories.length} local stories. Play stories.`);
  el.innerHTML = `
    <span class="ring" aria-hidden="true"><span class="inner">${EMOJI[p.stories[0].category] || "📰"}</span></span>
    <span class="name" aria-hidden="true">${esc(p.name)}</span>`;
  return el;
}

let lastLevel = null;
function updateLevel() {
  const level = map.getZoom() >= LOCAL_ZOOM ? "local" : "world";
  if (level === lastLevel) return;
  lastLevel = level;
  $("#map").dataset.level = level;
  // hidden markers must not be reachable by keyboard
  countryMarkers.forEach((m) => (m.getElement().tabIndex = level === "world" ? 0 : -1));
  placeMarkers.forEach((m) => (m.getElement().tabIndex = level === "local" ? 0 : -1));
  const short = isMobile();
  $("#zoom-hint-text").textContent = level === "world"
    ? (short ? "Tap a flag · Zoom in for local news" : "Tap a flag to read that country's news · Zoom in for local stories")
    : (short ? "Local stories · Tap a circle" : "Showing local stories · Tap a circle to watch");
}

/* Gentle globe spin on the landing view. Stops on any interaction. */
let spinning = false;
function startSpin() {
  if (reducedMotion) return;
  spinning = true;
  const step = () => {
    if (!spinning) return;
    const c = map.getCenter();
    map.easeTo({ center: [c.lng + 6, c.lat], duration: 1500, easing: (t) => t });
  };
  map.on("moveend", () => spinning && step());
  step();
}
function stopSpin() { spinning = false; }

function flyTo(center, zoom, pitch = 0) {
  stopSpin();
  const pad = isMobile()
    ? { top: 60, bottom: Math.round(innerHeight * 0.55), left: 0, right: 0 }
    : { top: 60, bottom: 40, left: 0, right: $("#country-panel").hidden ? 0 : 460 };
  map.flyTo({ center, zoom, pitch, bearing: pitch ? -12 : 0, padding: pad, duration: reducedMotion ? 0 : 2200, essential: true });
}

/* =========================================================
   Layers + history (Back button closes the top layer)
   ========================================================= */
const stack = [];
const returnFocus = [];
function pushLayer(name, hash) {
  returnFocus.push(document.activeElement);
  stack.push(name);
  history.pushState({ pw: stack.length }, "", hash);
}
function closeTop() { if (stack.length) history.back(); }
addEventListener("popstate", () => {
  const name = stack.pop();
  if (!name) return;
  ({ panel: hidePanel, viewer: hideViewer, article: hideArticle, list: hideList })[name]?.();
  const f = returnFocus.pop();
  if (f && document.contains(f) && f.offsetParent !== null) f.focus({ preventScroll: true });
});

function trapFocus(container, e) {
  if (e.key !== "Tab") return;
  const f = [...container.querySelectorAll('a[href],button:not([disabled]),input,textarea,[tabindex]:not([tabindex="-1"])')]
    .filter((el) => el.offsetParent !== null);
  if (!f.length) return;
  const [first, last] = [f[0], f[f.length - 1]];
  if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
  else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
}

document.addEventListener("keydown", (e) => {
  const top = stack[stack.length - 1];
  if (!$("#welcome").hidden) return trapFocus($("#welcome"), e);
  if (top === "article") trapFocus($("#article .sheet"), e);
  if (top === "viewer") {
    trapFocus($("#viewer"), e);
    if (e.key === "ArrowRight") nextStory();
    if (e.key === "ArrowLeft") prevStory();
    if (e.key === " " && e.target === document.body) { e.preventDefault(); togglePause(); }
  }
  if (e.key === "Escape" && top) { e.preventDefault(); closeTop(); }
});

/* =========================================================
   Vote widget (shared everywhere)
   ========================================================= */
const UP = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l7 8h-4.5v8h-5v-8H5z" fill="currentColor"/></svg>`;
const DOWN = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20l-7-8h4.5V4h5v8H19z" fill="currentColor"/></svg>`;
function voteHTML(s, row = false) {
  const v = votes[s.id] || 0;
  return `<div class="vote${row ? " row" : ""}" data-story="${s.id}" role="group" aria-label="Vote on this story">
    <button class="up" data-vote="1" aria-pressed="${v === 1}" aria-label="Upvote">${UP}</button>
    <span class="score" aria-live="polite"><span class="sr-only">Score </span>${scoreOf(s)}</span>
    <button class="down" data-vote="-1" aria-pressed="${v === -1}" aria-label="Downvote">${DOWN}</button>
  </div>`;
}
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-vote]");
  if (!btn) return;
  e.stopPropagation();
  const id = btn.closest(".vote").dataset.story;
  const val = +btn.dataset.vote;
  votes[id] = votes[id] === val ? 0 : val;
  store.set("votes", votes);
  const s = STORY_INDEX.get(id);
  document.querySelectorAll(`.vote[data-story="${id}"]`).forEach((w) => {
    w.querySelector(".up").setAttribute("aria-pressed", votes[id] === 1);
    w.querySelector(".down").setAttribute("aria-pressed", votes[id] === -1);
    const sc = w.querySelector(".score");
    sc.innerHTML = `<span class="sr-only">Score </span>${scoreOf(s)}`;
    sc.classList.remove("bump"); void sc.offsetWidth; sc.classList.add("bump");
  });
});

/* =========================================================
   Country panel
   ========================================================= */
let currentCountry = null;
let sortMode = "top";

function openCountry(code, { fly = false } = {}) {
  const c = COUNTRY_INDEX.get(code);
  if (!c) return;
  const top = stack[stack.length - 1];
  currentCountry = c;
  renderPanel();
  const panel = $("#country-panel");
  panel.classList.remove("closing");
  panel.hidden = false;
  if (top === "panel") history.replaceState({ pw: stack.length }, "", `#/c/${code}`);
  else pushLayer("panel", `#/c/${code}`);
  $("#panel-title").focus({ preventScroll: true });
  if (fly) flyTo(c.center, isMobile() ? 3 : 3.6);
}

function renderPanel() {
  const c = currentCountry;
  $("#panel-flag").src = flag(c.code);
  $("#panel-title").textContent = c.name;
  $("#panel-eyebrow").textContent = `${c.stories.length} stories · ${c.places.length} places`;

  const row = $("#places-row");
  row.innerHTML = "";
  c.places.forEach((p, i) => {
    const b = placeBubble(p, i);
    b.addEventListener("click", () => openViewer(p.id, { fly: true }));
    row.append(b);
  });

  const list = [...c.stories].sort((a, b) => sortMode === "top" ? scoreOf(b) - scoreOf(a) : a.hoursAgo - b.hoursAgo);
  $("#panel-stories").innerHTML = list.map((s, i) => `
    <li class="story" style="--d:${0.05 + i * 0.04}s">
      ${voteHTML(s)}
      <div class="story-main">
        <button class="story-open" data-open="${s.id}">
          <div class="meta">
            <span class="chip">${EMOJI[s.category] || "📰"} ${esc(s.category)}</span>
            <span>${esc(s.place || "National")}</span><span aria-hidden="true">·</span><span>${ago(s.hoursAgo)}</span>
          </div>
          <h3>${esc(s.headline)}</h3>
        </button>
        <div class="actions">
          <span>${esc(s.source.name)}</span>
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>${commentsOf(s).length}<span class="sr-only"> comments</span></span>
        </div>
      </div>
    </li>`).join("");
}

function hidePanel() {
  const p = $("#country-panel");
  p.classList.add("closing");
  setTimeout(() => { if (p.classList.contains("closing")) { p.hidden = true; p.classList.remove("closing"); } }, reducedMotion ? 0 : 280);
}

$("#panel-close").addEventListener("click", closeTop);
document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
  sortMode = t.dataset.sort;
  document.querySelectorAll(".tab").forEach((x) => x.setAttribute("aria-selected", x === t));
  renderPanel();
}));
document.addEventListener("click", (e) => {
  const o = e.target.closest("[data-open]");
  if (o) openArticle(o.dataset.open);
});

/* =========================================================
   Story viewer (Snapchat-like)
   ========================================================= */
let vPlace = null, vIndex = 0, vStart = 0, vElapsed = 0, vPaused = reducedMotion, vRaf = 0;

function openViewer(placeId, { fly = false } = {}) {
  const p = PLACE_INDEX.get(placeId);
  if (!p) return;
  if (fly) flyTo(p.at, 10.5, 55);
  vPlace = p; vIndex = 0;
  seen.add(p.id); store.set("seen", [...seen]);
  document.querySelectorAll(`.local[data-place="${p.id}"]`).forEach((el) => el.classList.add("seen"));
  const c = COUNTRY_INDEX.get(p.country);
  $("#viewer-flag").src = flag(c.code);
  $("#viewer-place").textContent = p.name;
  $("#viewer-progress").innerHTML = p.stories.map(() => "<span><i></i></span>").join("");
  $("#viewer").hidden = false;
  pushLayer("viewer", `#/p/${p.id}`);
  setPaused(reducedMotion);
  showStory(0);
  $("#viewer-close").focus();
}

function showStory(i) {
  vIndex = i;
  const s = vPlace.stories[i];
  const c = COUNTRY_INDEX.get(vPlace.country);
  $("#viewer-sub").textContent = `${c.name} · ${ago(s.hoursAgo)} · Story ${i + 1} of ${vPlace.stories.length}`;
  $(".viewer-card").dataset.cat = s.category;
  [...$("#viewer-progress").children].forEach((bar, j) => {
    bar.classList.toggle("done", j < i);
    bar.firstChild.style.width = j < i ? "100%" : "0";
  });
  $("#viewer-body").innerHTML = `
    <div class="big-emoji" aria-hidden="true">${EMOJI[s.category] || "📰"}</div>
    <span class="chip">${esc(s.category)} · Sample story</span>
    <h3>${esc(s.headline)}</h3>
    <ul>${s.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    <div class="viewer-actions">
      ${voteHTML(s, true)}
      <button class="btn light" data-open="${s.id}">Details & comments</button>
    </div>`;
  vElapsed = 0; vStart = performance.now();
  cancelAnimationFrame(vRaf);
  tick();
}

function tick() {
  if ($("#viewer").hidden) return;
  const bar = $("#viewer-progress").children[vIndex]?.firstChild;
  if (!vPaused && stack[stack.length - 1] === "viewer") {
    const t = vElapsed + (performance.now() - vStart);
    if (bar) bar.style.width = Math.min(100, (t / STORY_MS) * 100) + "%";
    if (t >= STORY_MS) return nextStory();
  } else {
    vStart = performance.now();
  }
  vRaf = requestAnimationFrame(tick);
}
function setPaused(p) {
  if (!p && vPaused) vStart = performance.now();
  if (p && !vPaused) vElapsed += performance.now() - vStart;
  vPaused = p;
  const b = $("#viewer-pause");
  b.setAttribute("aria-pressed", p);
  b.setAttribute("aria-label", p ? "Play stories" : "Pause stories");
}
function togglePause() { setPaused(!vPaused); }
function nextStory() { vIndex < vPlace.stories.length - 1 ? showStory(vIndex + 1) : closeTop(); }
function prevStory() { showStory(Math.max(0, vIndex - 1)); }
function hideViewer() { $("#viewer").hidden = true; cancelAnimationFrame(vRaf); }

$("#viewer-close").addEventListener("click", closeTop);
$("#viewer-pause").addEventListener("click", togglePause);
$("#viewer-next").addEventListener("click", nextStory);
$("#viewer-prev").addEventListener("click", prevStory);
$("#viewer").addEventListener("click", (e) => { if (e.target.id === "viewer") closeTop(); });
// swipe down to close, swipe sideways to navigate
let touch0 = null;
$("#viewer").addEventListener("touchstart", (e) => { touch0 = e.touches[0]; }, { passive: true });
$("#viewer").addEventListener("touchend", (e) => {
  if (!touch0) return;
  const t = e.changedTouches[0], dx = t.clientX - touch0.clientX, dy = t.clientY - touch0.clientY;
  if (dy > 90 && Math.abs(dx) < 60) closeTop();
  else if (Math.abs(dx) > 60 && Math.abs(dy) < 60) (dx < 0 ? nextStory : prevStory)();
  touch0 = null;
});
document.addEventListener("visibilitychange", () => { if (document.hidden && !$("#viewer").hidden) setPaused(true); });

/* =========================================================
   Article (details, source, comments)
   ========================================================= */
let currentStory = null;
const COLORS = ["#ffd34d", "#7fe0b0", "#8fc1ff", "#ffa3c4", "#c4a7ff", "#ffb380"];

function openArticle(id) {
  const s = STORY_INDEX.get(id);
  if (!s) return;
  currentStory = s;
  renderArticle();
  $("#article").hidden = false;
  $("#article .sheet").scrollTop = 0;
  pushLayer("article", `#/s/${s.id}`);
  $("#article-title").focus({ preventScroll: true });
}

function renderArticle() {
  const s = currentStory;
  const c = COUNTRY_INDEX.get(s.country);
  const list = commentsOf(s);
  $("#article-content").innerHTML = `
    <div class="art-head">
      <div class="art-place"><img src="${flag(c.code)}" alt="" />${esc(s.place ? `${s.place}, ${c.name}` : c.name)} · ${ago(s.hoursAgo)}</div>
      <div class="meta" style="margin-top:10px">
        <span class="chip">${EMOJI[s.category] || "📰"} ${esc(s.category)}</span>
        <span class="chip sample">Sample story — not real news</span>
      </div>
      <h2 id="article-title" tabindex="-1">${esc(s.headline)}</h2>
      <p class="original">Original headline: <strong>${esc(s.original)}</strong></p>
    </div>
    <div class="art-bar">
      ${voteHTML(s, true)}
      <button class="btn" id="share-btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Share</button>
      <a class="btn" href="#comments-title">${list.length} comments</a>
    </div>
    <section class="box" aria-labelledby="short-h"><h3 id="short-h">In short</h3><ul>${s.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></section>
    <section class="box why" aria-labelledby="why-h"><h3 id="why-h">Why it matters</h3><p style="margin:0;font-size:17px">${esc(s.why)}</p></section>
    <h3 style="font-size:20px;margin:26px 0 6px">What happened</h3>
    <p class="prose">${esc(s.body)}</p>
    <div class="source-card">
      <span class="logo" aria-hidden="true">${esc(s.source.name[0])}</span>
      <div><strong>Source: ${esc(s.source.name)}</strong><small>Placeholder source for the prototype</small></div>
      <a class="btn" href="${esc(s.source.url)}" target="_blank" rel="noopener noreferrer">Read original<span class="sr-only"> (opens in a new tab)</span></a>
    </div>
    <section class="comments" aria-labelledby="comments-title">
      <h3 id="comments-title" tabindex="-1">Comments (${list.length})</h3>
      <form class="comment-form" id="comment-form" novalidate>
        <label for="c-name">Your name <span class="muted">(optional)</span></label>
        <input id="c-name" name="name" maxlength="40" autocomplete="nickname" />
        <label for="c-text">Your comment</label>
        <textarea id="c-text" name="text" maxlength="280" required aria-describedby="c-help c-count"></textarea>
        <div class="row">
          <small id="c-help">Be kind. Follow the <a href="terms.html#community" target="_blank" rel="noopener">community rules</a>.</small>
          <small id="c-count" aria-live="polite">0 / 280</small>
        </div>
        <button class="btn primary" type="submit">Post comment</button>
      </form>
      <ul class="comment-list">${list.map(commentHTML).join("") || '<li class="muted">No comments yet. Be the first!</li>'}</ul>
    </section>`;

  $("#share-btn").addEventListener("click", async () => {
    const url = location.origin + location.pathname + `#/s/${s.id}`;
    try {
      if (navigator.share) await navigator.share({ title: s.headline, url });
      else { await navigator.clipboard.writeText(url); toast("Link copied"); }
    } catch {}
  });
  const ta = $("#c-text");
  ta.addEventListener("input", () => ($("#c-count").textContent = `${ta.value.length} / 280`));
  $("#comment-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = ta.value.trim();
    if (!text) { ta.setAttribute("aria-invalid", "true"); ta.focus(); toast("Please write a comment first"); return; }
    const name = $("#c-name").value.trim() || "You";
    (userComments[s.id] ||= []).unshift({ id: "u" + Date.now(), name, text, ago: "now", mine: true });
    store.set("comments", userComments);
    renderArticle();
    $("#comments-title").focus();
    toast("Comment posted");
  });
}

function commentHTML(c) {
  const col = COLORS[c.name.charCodeAt(0) % COLORS.length];
  return `<li class="comment">
    <span class="avatar" style="background:${col}" aria-hidden="true">${esc(c.name[0].toUpperCase())}</span>
    <div>
      <div class="who">${esc(c.name)}<small>${esc(c.ago)}</small></div>
      <p>${esc(c.text)}</p>
      ${c.mine ? "" : `<button class="report" data-report>Report</button>`}
    </div>
  </li>`;
}
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-report]")) toast("Thanks — a moderator will review this comment.");
});

function hideArticle() { $("#article").hidden = true; }
$("#article-close").addEventListener("click", closeTop);
$("#article").addEventListener("click", (e) => { if (e.target.id === "article") closeTop(); });

/* =========================================================
   List view (accessible alternative to the map)
   ========================================================= */
function renderList() {
  $("#country-list").innerHTML = COUNTRIES.map((c) => `
    <li><button class="country-card" data-country="${c.code}">
      <img src="${flag(c.code)}" alt="" />
      <span><strong>${esc(c.name)}</strong><small>${c.stories.length} stories · ${c.places.map((p) => esc(p.name)).join(", ")}</small></span>
    </button></li>`).join("");
}
function showList() {
  renderList();
  $("#list-view").hidden = false;
  $("#list-toggle").setAttribute("aria-pressed", "true");
  pushLayer("list", "#/list");
  $("#list-view").focus();
}
function hideList() { $("#list-view").hidden = true; $("#list-toggle").setAttribute("aria-pressed", "false"); }
$("#list-toggle").addEventListener("click", () => {
  if (stack.includes("list")) {
    // close everything above and including the list
    const n = stack.length - stack.indexOf("list");
    history.go(-n);
  } else showList();
});
$(".skip-link").addEventListener("click", (e) => { e.preventDefault(); if (!stack.includes("list")) showList(); });
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-country]");
  if (b) openCountry(b.dataset.country, { fly: true });
});

/* =========================================================
   Search (combobox)
   ========================================================= */
const searchItems = [
  ...COUNTRIES.map((c) => ({ type: "country", id: c.code, label: c.name, code: c.code, sub: "Country" })),
  ...COUNTRIES.flatMap((c) => c.places.map((p) => ({ type: "place", id: p.id, label: p.name, code: c.code, sub: c.name }))),
];
const input = $("#search-input"), results = $("#search-results");
let active = -1, shown = [];
function renderResults() {
  const q = input.value.trim().toLowerCase();
  shown = q ? searchItems.filter((i) => i.label.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q)).slice(0, 8) : [];
  active = shown.length ? 0 : -1;
  results.innerHTML = shown.length
    ? shown.map((it, i) => `<li role="option" id="opt-${i}" aria-selected="${i === active}" data-i="${i}">
        <img class="flag-xs" src="${flag(it.code)}" alt="" />${esc(it.label)}<small>${esc(it.sub)}</small></li>`).join("")
    : q ? `<li role="option" aria-disabled="true">No matches</li>` : "";
  results.hidden = !q;
  input.setAttribute("aria-expanded", String(!!q));
  input.setAttribute("aria-activedescendant", active >= 0 ? `opt-${active}` : "");
}
function choose(i) {
  const it = shown[i];
  if (!it) return;
  input.value = ""; renderResults(); input.blur();
  if (it.type === "country") openCountry(it.id, { fly: true });
  else openViewer(it.id, { fly: true });
}
input.addEventListener("input", renderResults);
input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (!shown.length) return;
    active = (active + (e.key === "ArrowDown" ? 1 : -1) + shown.length) % shown.length;
    results.querySelectorAll("li").forEach((li, i) => li.setAttribute("aria-selected", i === active));
    input.setAttribute("aria-activedescendant", `opt-${active}`);
  } else if (e.key === "Enter") { e.preventDefault(); choose(active); }
  else if (e.key === "Escape") { e.stopPropagation(); input.value = ""; renderResults(); }
});
results.addEventListener("mousedown", (e) => { const li = e.target.closest("[data-i]"); if (li) { e.preventDefault(); choose(+li.dataset.i); } });
input.addEventListener("blur", () => setTimeout(() => { results.hidden = true; input.setAttribute("aria-expanded", "false"); }, 120));

/* =========================================================
   Controls, theme, welcome, deep links
   ========================================================= */
$("#zoom-in").addEventListener("click", () => { stopSpin(); map.zoomIn(); });
$("#zoom-out").addEventListener("click", () => { stopSpin(); map.zoomOut(); });
$("#reset-view").addEventListener("click", () => { stopSpin(); map.flyTo({ center: [15, 22], zoom: isMobile() ? 0.9 : 1.6, pitch: 0, bearing: 0, padding: 0, duration: reducedMotion ? 0 : 1800 }); });

function syncThemeButton() {
  $("#theme-toggle").setAttribute("aria-label", theme() === "light" ? "Switch to dark theme" : "Switch to light theme");
  document.querySelector('meta[name="theme-color"]').content = theme() === "light" ? "#eef1f6" : "#0a0e17";
}
$("#theme-toggle").addEventListener("click", async () => {
  document.documentElement.dataset.theme = theme() === "light" ? "dark" : "light";
  store.set("theme", null);
  try { localStorage.setItem("pw-theme", document.documentElement.dataset.theme); } catch {}
  syncThemeButton();
  if (map) map.setStyle(await pickStyle(), { diff: false });
});
syncThemeButton();

function handleDeepLink() {
  const h = location.hash;
  history.replaceState(null, "", "#/");
  let m;
  if ((m = h.match(/^#\/c\/(\w+)/))) openCountry(m[1], { fly: true });
  else if ((m = h.match(/^#\/p\/([\w-]+)/))) openViewer(m[1], { fly: true });
  else if ((m = h.match(/^#\/s\/([\w-]+)/))) {
    const s = STORY_INDEX.get(m[1]);
    if (s) { openCountry(s.country, { fly: true }); openArticle(s.id); }
  } else if (h === "#/list") showList();
}

if (!store.get("welcomed", false)) {
  $("#welcome").hidden = false;
  setTimeout(() => $("#welcome-go").focus(), 50);
}
$("#welcome-go").addEventListener("click", () => {
  store.set("welcomed", true);
  $("#welcome").hidden = true;
});

initMap();
