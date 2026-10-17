"use client";
/*
  Polls /api/news/mm every 60 seconds.
  ?demo=live (kept on the URL) is presentation mode: the 3 newest real seed
  stories stay hidden, then one is revealed each minute. Their dates and
  sources are the real ones. Only the arrival is staged.
*/
import { useEffect, useState } from "react";
import { COUNTRY_INDEX, type Story } from "@/lib/data";
import { useNav } from "@/lib/store";

export type LiveMode = "live" | "snapshot";
type Payload = { mode: LiveMode; fetchedAt: string; stories: Story[] };

type State = {
  stories: Story[];
  mode: LiveMode;
  fetchedAt: string;
  newIds: string[];
  ready: boolean;
};

const seed = () => (COUNTRY_INDEX.get("mm")?.stories ?? []).map((s) => s);
let state: State = { stories: seed(), mode: "snapshot", fetchedAt: "", newIds: [], ready: false };
let listeners = new Set<() => void>();
let poll: number | null = null;
let reveal: number | null = null;
let watching = false;
let booted = false;
let prevIds = new Set<string>();
let held: string[] = [];
let revealed = 0;
let demoOn = false;
const freshUntil = new Map<string, number>();

function emit() {
  listeners.forEach((fn) => fn());
}
function newestSeed(stories: Story[]) {
  return stories
    .filter((s) => s.real && !s.headlineOnly && s.publishedAt)
    .sort((a, b) => {
      const byDate = b.publishedAt!.localeCompare(a.publishedAt!);
      if (byDate) return byDate;
      return stories.indexOf(b) - stories.indexOf(a);
    })
    .slice(0, 3)
    .map((s) => s.id);
}
function hiddenIds() {
  return demoOn ? new Set(held.slice(revealed)) : new Set<string>();
}
function visibleOf(stories: Story[]) {
  const hide = hiddenIds();
  return stories.filter((s) => !hide.has(s.id));
}
function markNew(ids: string[]) {
  if (!ids.length) return;
  const until = Date.now() + 10_000;
  for (const id of ids) freshUntil.set(id, until);
  window.setTimeout(() => {
    let changed = false;
    for (const id of ids) {
      if ((freshUntil.get(id) ?? 0) <= Date.now()) { freshUntil.delete(id); changed = true; }
    }
    if (changed) {
      state = { ...state, newIds: [...freshUntil.keys()] };
      emit();
    }
  }, 10_000);
}
function apply(stories: Story[], mode: LiveMode, fetchedAt: string) {
  if (!held.length) held = newestSeed(stories);
  const visible = visibleOf(stories);
  const arrived = booted ? visible.filter((s) => !prevIds.has(s.id)).map((s) => s.id) : [];
  booted = true;
  prevIds = new Set(visible.map((s) => s.id));
  markNew(arrived);
  state = { stories, mode, fetchedAt, newIds: [...freshUntil.keys()], ready: true };
  emit();
}

async function load() {
  try {
    const res = await fetch("/api/news/mm");
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json() as Payload;
    apply(data.stories, data.mode, data.fetchedAt);
  } catch {
    apply(seed(), "snapshot", new Date().toISOString());
  }
}

function startReveal() {
  if (reveal != null) return;
  reveal = window.setInterval(() => {
    if (document.hidden || !demoOn || revealed >= held.length) return;
    revealed += 1;
    apply(state.stories, state.mode, state.fetchedAt);
  }, 60_000);
}

function ensure() {
  if (poll != null) return;
  void load();
  poll = window.setInterval(() => { if (!document.hidden) void load(); }, 60_000);
  if (!watching) {
    document.addEventListener("visibilitychange", () => { if (!document.hidden) void load(); });
    watching = true;
  }
  startReveal();
}

export function useLiveNews(active: boolean) {
  const demo = useNav((s) => s.demo) === "live";
  const [, bump] = useState(0);
  useEffect(() => {
    demoOn = demo;
    if (state.ready) apply(state.stories, state.mode, state.fetchedAt);
  }, [demo]);
  useEffect(() => {
    if (!active) return;
    const sub = () => bump((n) => n + 1);
    listeners.add(sub);
    ensure();
    return () => { listeners.delete(sub); };
  }, [active]);

  const stories = active ? visibleOf(state.stories) : [];
  return {
    stories,
    mode: state.mode,
    fetchedAt: state.fetchedAt,
    newIds: state.newIds,
    ready: state.ready,
  };
}

export function liveStory(id: string | null) {
  if (!id) return undefined;
  return state.stories.find((s) => s.id === id);
}
