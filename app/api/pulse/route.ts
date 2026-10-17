/*
  GET /api/pulse?story=<id>   snapshot for one map story
  GET /api/pulse?q=<question> snapshot for a free-text question

  Today this returns fictional demo data from lib/pulse.ts. No social
  network is called.

  Real pipeline to plug in later (replace the body of GET, keep the JSON shape):
  1. Question → an LLM proposes hashtags and search phrases.
  2. Instagram Graph API hashtag search (top_media and recent_media) returns
     caption, permalink, like_count, comments_count. Add any other source the
     same way.
  3. An LLM writes a short summary that must cite posts as [n].
  4. The server checks that every [n] maps to a post that was actually fetched.
     If a cite is missing, drop the sentence or regenerate. Never invent a source.
*/

import { NextRequest, NextResponse } from "next/server";
import { STORY_INDEX } from "@/lib/data";
import { askPulse, getStoryPulse } from "@/lib/pulse";

export async function GET(req: NextRequest) {
  const storyId = req.nextUrl.searchParams.get("story");
  const q = req.nextUrl.searchParams.get("q");

  if (storyId) {
    const story = STORY_INDEX.get(storyId);
    if (!story) return NextResponse.json({ error: "Story not found" }, { status: 404 });
    await new Promise((r) => setTimeout(r, 900));
    return NextResponse.json(getStoryPulse(story));
  }

  if (q?.trim()) return NextResponse.json(await askPulse(q));
  return NextResponse.json({ error: "Pass story or q" }, { status: 400 });
}
