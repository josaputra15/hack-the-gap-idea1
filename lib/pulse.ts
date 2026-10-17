/* ------------------------------------------------------------------
   DEMO "what people say" snapshots.
   Every post, handle and number is fictional. Nothing here calls a
   network or a real social platform. A later API can return the same
   Pulse shape.
------------------------------------------------------------------- */
import { COUNTRY_INDEX, hash, type Story } from "./data";

export type PulseSource = {
  n: number;
  kind: "reel" | "post" | "comment";
  platform: "Instagram";
  handle: string;
  excerpt: string;
  likes: number;
  comments?: number;
  ago: string;
  url: string;
  topic: string;
};
export type PulseSentence = { text: string; cites: number[] };
export type PulseTopic = { id: string; label: string; emoji: string; share: number };
export type Pulse = {
  query: string;
  postsAnalyzed: number;
  window: string;
  updated: string;
  sentences: PulseSentence[];
  mood: { worried: number; hopeful: number; neutral: number; angry: number };
  topics: PulseTopic[];
  sources: PulseSource[];
  related: string[];
};

export const DEMO_ASKS = [
  "What is going on with the election in the US?",
  "Why are trains late in Germany?",
  "Is the Amazon rainforest recovering?",
];

const HANDLES = [
  "@city.walks.daily", "@sam_reports_demo", "@platform.notes", "@neighbor.desk",
  "@weekday.watch", "@local.frame.lab", "@queue.stories", "@plain.caption",
  "@block.by.block", "@demo.fieldnotes",
];
const KINDS: PulseSource["kind"][] = ["reel", "post", "comment", "reel", "post", "comment", "post", "reel"];
const AGOS = ["1h", "2h", "3h", "5h", "8h", "14h", "1d", "1d"];

function moodFrom(h: number): Pulse["mood"] {
  const worried = 22 + (h % 21);
  const hopeful = 18 + ((h >> 4) % 16);
  const angry = 6 + ((h >> 8) % 10);
  return { worried, hopeful, angry, neutral: 100 - worried - hopeful - angry };
}

function source(partial: Omit<PulseSource, "platform" | "url"> & { id: string }): PulseSource {
  return { ...partial, platform: "Instagram", url: `https://example.com/demo/pulse/${partial.id}` };
}

/** Throws in development if a [n] chip does not match a source. */
export function assertCitations(p: Pulse) {
  if (process.env.NODE_ENV === "production") return;
  const ids = new Set(p.sources.map((s) => s.n));
  for (const sentence of p.sentences) {
    for (const n of sentence.cites) {
      if (!ids.has(n)) throw new Error(`Pulse cite [${n}] has no source for “${p.query}”`);
    }
  }
  const sum = p.mood.worried + p.mood.hopeful + p.mood.neutral + p.mood.angry;
  if (sum !== 100) throw new Error(`Pulse mood adds up to ${sum}, not 100`);
}

function pack(p: Pulse): Pulse {
  assertCitations(p);
  return p;
}

export function getStoryPulse(story: Story): Pulse {
  const country = COUNTRY_INDEX.get(story.country)?.name ?? "this country";
  const named = story.place ?? (country === "United States" || country === "United Kingdom" ? `the ${country}` : country);
  const where = story.place ?? named;
  const h = hash(story.id);
  const point = (s: string) => s.replace(/\.$/, "");
  const topics: PulseTopic[] = [
    { id: "main", label: story.category, emoji: "📰", share: 0.4 },
    { id: "local", label: story.place ?? country, emoji: "📍", share: 0.28 },
    { id: "why", label: "Why it matters", emoji: "💬", share: 0.2 },
    { id: "next", label: "What happens next", emoji: "⏭️", share: 0.12 },
  ];
  const lines = [
    `I keep seeing posts about this: ${point(story.points[0])}`,
    `From ${where}: people want this explained in plain words.`,
    story.why,
    `Has anyone nearby checked this themselves?`,
    point(story.points[1]),
    `Sharing this so neighbors in ${where} see it.`,
    `The comments are mostly questions, not answers.`,
    `A short clip of the same story is going around today.`,
  ];
  const sources = lines.map((excerpt, i) => source({
    id: `${story.id}-p${i + 1}`,
    n: i + 1,
    kind: KINDS[i],
    handle: HANDLES[(h + i) % HANDLES.length],
    excerpt,
    likes: 40 + ((h >> i) % 900),
    comments: KINDS[i] === "comment" ? undefined : 4 + ((h >> (i + 2)) % 80),
    ago: AGOS[i],
    topic: topics[i % topics.length].id,
  }));
  return pack({
    query: story.headline,
    postsAnalyzed: 180 + (h % 240),
    window: "last 24 hours",
    updated: "5 min ago",
    sentences: [
      { text: `Most people are sharing that ${point(story.points[0]).charAt(0).toLowerCase()}${point(story.points[0]).slice(1)}.`, cites: [1, 3] },
      { text: `Some posts worry about what this means for ${where}.`, cites: [2, 6] },
      { text: story.place
        ? `Locals in ${where} say ${point(story.points[1]).charAt(0).toLowerCase()}${point(story.points[1]).slice(1)}.`
        : `People in ${named} say ${point(story.points[1]).charAt(0).toLowerCase()}${point(story.points[1]).slice(1)}.`, cites: [5, 4] },
      { text: `A few comments add that ${point(story.why).charAt(0).toLowerCase()}${point(story.why).slice(1)}.`, cites: [7, 8] },
    ],
    mood: moodFrom(h),
    topics,
    sources,
    related: [
      `What are people in ${where} posting about this?`,
      `Is this ${story.category.toLowerCase()} story getting more attention?`,
      `What else are people saying about ${named}?`,
    ],
  });
}

function election(query: string): Pulse {
  const topics: PulseTopic[] = [
    { id: "lines", label: "Polling-place lines", emoji: "🚶", share: 0.32 },
    { id: "mail", label: "Mail-in ballots", emoji: "✉️", share: 0.24 },
    { id: "first", label: "First-time voters", emoji: "🗳️", share: 0.18 },
    { id: "official", label: "Official election sites", emoji: "🔗", share: 0.16 },
    { id: "clips", label: "Debate clips", emoji: "🎬", share: 0.1 },
  ];
  return pack({
    query,
    postsAnalyzed: 486,
    window: "last 24 hours",
    updated: "5 min ago",
    sentences: [
      { text: "Most people are sharing photos of lines at polling places and asking how long the wait really is.", cites: [1, 4] },
      { text: "A lot of posts are questions about mail-in ballots: when they must arrive, and how to track one.", cites: [2, 6] },
      { text: "First-time voters say they want a simple checklist before they go.", cites: [3, 7] },
      { text: "Several reels remind people to use their official state election website, not a screenshot from a stranger.", cites: [5, 8] },
    ],
    mood: { worried: 34, hopeful: 28, neutral: 30, angry: 8 },
    topics,
    sources: [
      source({ id: "us-el-1", n: 1, kind: "reel", handle: "@city.walks.daily", excerpt: "The line outside our library polling place wrapped around the block at 8am. People were calm and chatting.", likes: 2400, comments: 186, ago: "2h", topic: "lines" }),
      source({ id: "us-el-2", n: 2, kind: "post", handle: "@ballot.box.notes", excerpt: "Question, not a rumor: if I mailed my ballot on Monday, where do I look to see that it arrived?", likes: 980, comments: 240, ago: "3h", topic: "mail" }),
      source({ id: "us-el-3", n: 3, kind: "comment", handle: "@first.vote.diary", excerpt: "First time voting. I just want a checklist: ID, ballot, and where my polling place actually is.", likes: 410, ago: "4h", topic: "first" }),
      source({ id: "us-el-4", n: 4, kind: "post", handle: "@queue.stories", excerpt: "Waited 40 minutes. Staff handed out sample ballots so people could read them in line.", likes: 1520, comments: 96, ago: "5h", topic: "lines" }),
      source({ id: "us-el-5", n: 5, kind: "reel", handle: "@plain.caption", excerpt: "Please open your state's official election site. A screenshot in a group chat is not a source.", likes: 3100, comments: 220, ago: "1h", topic: "official" }),
      source({ id: "us-el-6", n: 6, kind: "comment", handle: "@sam_reports_demo", excerpt: "My county tracker says the ballot was received. Sharing the official link, not a third-party app.", likes: 260, ago: "6h", topic: "mail" }),
      source({ id: "us-el-7", n: 7, kind: "post", handle: "@neighbor.desk", excerpt: "Took my little sister for her first vote. The poll worker walked her through each step.", likes: 870, comments: 64, ago: "8h", topic: "first" }),
      source({ id: "us-el-8", n: 8, kind: "reel", handle: "@weekday.watch", excerpt: "Clip from last night's debate is everywhere. I'm muting it and reading the voter guide instead.", likes: 640, comments: 150, ago: "14h", topic: "clips" }),
    ],
    related: [
      "How do people check a mail-in ballot?",
      "What are first-time voters asking?",
      "Where do posts say to find the official election site?",
    ],
  });
}

function trains(query: string): Pulse {
  const topics: PulseTopic[] = [
    { id: "delays", label: "Late trains", emoji: "🚆", share: 0.4 },
    { id: "links", label: "Missed connections", emoji: "🔁", share: 0.26 },
    { id: "towns", label: "Smaller cities", emoji: "🏘️", share: 0.2 },
    { id: "reasons", label: "Plain-language reasons", emoji: "🪧", share: 0.14 },
  ];
  return pack({
    query,
    postsAnalyzed: 312,
    window: "last 24 hours",
    updated: "8 min ago",
    sentences: [
      { text: "Commuters are posting platform photos and saying regional trains are running late again this morning.", cites: [1, 3] },
      { text: "The posts that travel furthest blame crowded connections, not one single route.", cites: [2, 5] },
      { text: "People in smaller cities say a missed train can mean an hour of waiting.", cites: [4, 7] },
      { text: "A few comments ask the rail company to post the reason in plain language, on the platform screen.", cites: [6, 8] },
    ],
    mood: { worried: 28, hopeful: 14, neutral: 36, angry: 22 },
    topics,
    sources: [
      source({ id: "de-tr-1", n: 1, kind: "reel", handle: "@rail.delay.notes", excerpt: "7:42 regional train still not here. The board just says 'delay' and nothing else.", likes: 1800, comments: 210, ago: "1h", topic: "delays" }),
      source({ id: "de-tr-2", n: 2, kind: "post", handle: "@bahn.commuter.demo", excerpt: "Missed the connection in Frankfurt by four minutes. Next train is in 50 minutes and it is already full.", likes: 2200, comments: 340, ago: "2h", topic: "links" }),
      source({ id: "de-tr-3", n: 3, kind: "post", handle: "@platform.notes", excerpt: "Third late train this week on the same line. Photo of the crowd on the platform.", likes: 960, comments: 88, ago: "3h", topic: "delays" }),
      source({ id: "de-tr-4", n: 4, kind: "comment", handle: "@weekday.watch", excerpt: "In our town there is one train an hour. If it is late, you just wait.", likes: 540, ago: "4h", topic: "towns" }),
      source({ id: "de-tr-5", n: 5, kind: "reel", handle: "@city.walks.daily", excerpt: "The delay is not one broken train. People are missing links and stacking up at the next station.", likes: 1500, comments: 120, ago: "5h", topic: "links" }),
      source({ id: "de-tr-6", n: 6, kind: "comment", handle: "@plain.caption", excerpt: "Please put the reason on the platform screen in normal words. 'Operational issue' helps no one.", likes: 730, ago: "6h", topic: "reasons" }),
      source({ id: "de-tr-7", n: 7, kind: "post", handle: "@neighbor.desk", excerpt: "Small station, no staff, no cafe. A late train here is an hour on a bench.", likes: 410, comments: 36, ago: "8h", topic: "towns" }),
      source({ id: "de-tr-8", n: 8, kind: "reel", handle: "@demo.fieldnotes", excerpt: "Filmed the departure board cycling through delays. Still no reason written out.", likes: 680, comments: 54, ago: "14h", topic: "reasons" }),
    ],
    related: [
      "Which German routes are people posting about?",
      "What do riders want on the platform screens?",
      "Are missed connections the main complaint?",
    ],
  });
}

function amazon(query: string): Pulse {
  const topics: PulseTopic[] = [
    { id: "photos", label: "Before-and-after photos", emoji: "🛰️", share: 0.3 },
    { id: "drop", label: "Less forest cut", emoji: "🌿", share: 0.28 },
    { id: "fires", label: "Fires and roads", emoji: "🔥", share: 0.24 },
    { id: "measure", label: "How to measure it", emoji: "📏", share: 0.18 },
  ];
  return pack({
    query,
    postsAnalyzed: 268,
    window: "last 24 hours",
    updated: "12 min ago",
    sentences: [
      { text: "Most posts are before-and-after pictures, and people disagree on what “recovering” means.", cites: [1, 4] },
      { text: "Some accounts say fewer trees were cut this year and treat that as good news.", cites: [2, 5] },
      { text: "Others point at fires and roads still cutting through the forest.", cites: [3, 6] },
      { text: "Comments from researchers ask for the same measurement, over the same months, before anyone calls it a recovery.", cites: [7, 8] },
    ],
    mood: { worried: 36, hopeful: 30, neutral: 26, angry: 8 },
    topics,
    sources: [
      source({ id: "am-1", n: 1, kind: "reel", handle: "@forest.watch.lab", excerpt: "Side-by-side satellite frames. One year looks greener. People in the comments cannot agree if that is recovery.", likes: 3400, comments: 510, ago: "2h", topic: "photos" }),
      source({ id: "am-2", n: 2, kind: "post", handle: "@canopy.counts", excerpt: "The figure going around says less forest was cut than last year. I want the original chart, not a crop.", likes: 1200, comments: 160, ago: "3h", topic: "drop" }),
      source({ id: "am-3", n: 3, kind: "post", handle: "@demo.fieldnotes", excerpt: "Smoke and a new dirt road in the same frame. Cutting can fall while damage continues.", likes: 2100, comments: 240, ago: "4h", topic: "fires" }),
      source({ id: "am-4", n: 4, kind: "comment", handle: "@plain.caption", excerpt: "Green in a photo is not the same as a forest coming back. Regrowth takes years.", likes: 890, ago: "5h", topic: "photos" }),
      source({ id: "am-5", n: 5, kind: "reel", handle: "@sam_reports_demo", excerpt: "A hopeful clip: rangers counting new growth in one protected patch. They say it is local, not the whole Amazon.", likes: 1760, comments: 130, ago: "6h", topic: "drop" }),
      source({ id: "am-6", n: 6, kind: "reel", handle: "@block.by.block", excerpt: "Night video of a fire line. The caption asks why 'recovery' posts ignore this.", likes: 2500, comments: 300, ago: "8h", topic: "fires" }),
      source({ id: "am-7", n: 7, kind: "comment", handle: "@local.frame.lab", excerpt: "Compare the same months, the same satellite, the same definition of forest. Otherwise the argument is noise.", likes: 640, ago: "14h", topic: "measure" }),
      source({ id: "am-8", n: 8, kind: "post", handle: "@neighbor.desk", excerpt: "I linked the public dataset in the caption. Please argue from that, not from a meme.", likes: 720, comments: 90, ago: "1d", topic: "measure" }),
    ],
    related: [
      "What do posts mean by recovering?",
      "Are people sharing fewer trees cut, or more fires?",
      "Which numbers do the comments trust?",
    ],
  });
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function generic(query: string): Pulse {
  const h = hash(query);
  const topic = query.trim().replace(/[?.!]+$/g, "").replace(/\s+/g, " ").slice(0, 80) || "this";
  const topics: PulseTopic[] = [
    { id: "seen", label: "What people saw", emoji: "👀", share: 0.38 },
    { id: "worry", label: "Worries", emoji: "😟", share: 0.27 },
    { id: "wait", label: "Too early to say", emoji: "⏳", share: 0.2 },
    { id: "local", label: "Local detail", emoji: "📍", share: 0.15 },
  ];
  const excerpts = [
    `Posting what I saw today about ${topic}. Not a news desk, just my street.`,
    `Worried about who is supposed to fix this. The comments are all questions.`,
    `A lot of reels repeat the same clip. I want one clear sentence on what changed.`,
    `Too early to say how this ends. People are guessing.`,
    `The worried posts are louder than the calm ones.`,
    `Someone nearby added a detail the big posts skipped.`,
    `Short reel, plain caption, lots of shares in the last few hours.`,
    `Comment section is split. Half want action, half want to wait for facts.`,
  ];
  const sources = excerpts.map((excerpt, i) => source({
    id: `g-${h}-${i + 1}`,
    n: i + 1,
    kind: KINDS[i],
    handle: HANDLES[(h + i) % HANDLES.length],
    excerpt,
    likes: 80 + ((h >> (i + 1)) % 700),
    comments: KINDS[i] === "comment" ? undefined : 6 + ((h >> i) % 40),
    ago: AGOS[i],
    topic: topics[i % topics.length].id,
  }));
  return pack({
    query,
    postsAnalyzed: 140 + (h % 200),
    window: "last 24 hours",
    updated: "just now",
    sentences: [
      { text: `Most people posting about this are sharing what they saw themselves.`, cites: [1, 3] },
      { text: "Some posts are worried, and they ask who is in charge of fixing it.", cites: [2, 5] },
      { text: "A smaller set of comments says it is too early to know how this ends.", cites: [4, 8] },
      { text: "A few reels add local detail that the widest posts skip.", cites: [6, 7] },
    ],
    mood: moodFrom(h),
    topics,
    sources,
    related: [
      "What are people most worried about?",
      "Which posts are first-hand, not reposts?",
      "What are people asking for next?",
    ],
  });
}

const DEMOS: { test: (q: string) => boolean; build: (query: string) => Pulse }[] = [
  { test: (q) => /election/.test(q) && /\b(us|u s|usa|america|united states)\b/.test(q), build: election },
  { test: (q) => /train/.test(q) && /german/.test(q), build: trains },
  { test: (q) => /amazon/.test(q) && /(rainforest|recover|forest)/.test(q), build: amazon },
];

/** Simulated wait, then a hand-written demo or a generic snapshot. */
export function askPulse(query: string): Promise<Pulse> {
  const clean = query.trim().slice(0, 200);
  const wait = 1600 + (hash(clean || "x") % 801);
  return new Promise((resolve) => {
    setTimeout(() => {
      const q = norm(clean);
      const hit = DEMOS.find((d) => d.test(q));
      resolve(hit ? hit.build(clean) : generic(clean || "this"));
    }, wait);
  });
}
