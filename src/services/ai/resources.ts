import { generateJson, isAiConfigured } from "./client";

/**
 * "What should I actually watch or read for this block?"
 *
 * A study plan that says "Learn: Rotational Motion — 45 minutes" has told the
 * student the hard part is their problem. This closes that gap.
 *
 * A deliberate constraint runs through the whole file: **the model never
 * supplies a URL.** It has no browser, so any deep link it produces is a guess
 * dressed as a fact, and a dead link in a study plan is worse than no link —
 * the student loses the minutes the block was for. What the model is good at is
 * knowing *what to look for*: which channel covers this topic well, what a
 * lecture on it is usually called, which article is the standard reference.
 * That comes back as a title, a creator and a search query, and the search URL
 * is built here against a known provider. Every link therefore resolves, and
 * what it resolves to is what the label says.
 */

export type ResourceKind = "video" | "article";

export interface SuggestedResource {
  kind: ResourceKind;
  /** What to look for, e.g. "Rotational Motion — Full Chapter One Shot". */
  title: string;
  /** Channel, publication or site, e.g. "Physics Wallah" or "Khan Academy". */
  provider: string;
  /** Why this one is worth the block's minutes. */
  why: string;
  /** Rough runtime for a video, when the model can estimate it. */
  minutes?: number;
  /** A search on `provider`'s host, or the open web. Always resolves. */
  url: string;
  /** The query behind `url`, shown so the student can see what was searched. */
  query: string;
}

export interface SuggestResourcesParams {
  topicTitle: string;
  /** Parent chapter / subject, for disambiguation ("Waves" in Physics vs Maths). */
  subjectPath?: string;
  /** The exam being prepared for, so the level matches. */
  examName?: string;
  /** What the block is for: watching a lecture differs from drilling problems. */
  intent?: "learn" | "practice" | "revise" | "test";
  videos?: number;
  articles?: number;
}

/* -------------------------------------------------------------------------- */
/*  Link construction                                                          */
/* -------------------------------------------------------------------------- */

const YOUTUBE_SEARCH = "https://www.youtube.com/results?search_query=";
const WIKIPEDIA_SEARCH = "https://en.wikipedia.org/w/index.php?search=";
const KHAN_SEARCH = "https://www.khanacademy.org/search?page_search_query=";
const WEB_SEARCH = "https://duckduckgo.com/?q=";

/** Sites we know the search endpoint for, so a suggestion can land on them. */
const ARTICLE_HOSTS: { match: RegExp; base: string }[] = [
  { match: /wikipedia/i, base: WIKIPEDIA_SEARCH },
  { match: /khan\s*academy/i, base: KHAN_SEARCH },
];

function buildUrl(kind: ResourceKind, provider: string, query: string): string {
  const encoded = encodeURIComponent(query);
  if (kind === "video") return `${YOUTUBE_SEARCH}${encoded}`;

  const host = ARTICLE_HOSTS.find((entry) => entry.match.test(provider));
  return host ? `${host.base}${encoded}` : `${WEB_SEARCH}${encoded}`;
}

/* -------------------------------------------------------------------------- */
/*  Suggestion                                                                 */
/* -------------------------------------------------------------------------- */

export async function suggestResources(
  params: SuggestResourcesParams
): Promise<SuggestedResource[]> {
  const videos = params.videos ?? 3;
  const articles = params.articles ?? 2;
  if (videos + articles === 0) return [];

  if (isAiConfigured()) {
    try {
      const suggested = await suggestWithModel(params, videos, articles);
      if (suggested.length > 0) return suggested;
    } catch {
      // fall through to the deterministic set
    }
  }
  return fallbackResources(params, videos, articles);
}

const INTENT_BRIEF: Record<NonNullable<SuggestResourcesParams["intent"]>, string> = {
  learn: "The student is meeting this topic for the first time — prefer a full explanatory lecture and a clear written introduction.",
  practice: "The student knows the theory — prefer worked-problem sessions and question banks over introductions.",
  revise: "The student is revising — prefer short summaries, formula sheets and rapid-recap videos.",
  test: "The student is about to be tested — prefer past-paper walkthroughs and common-mistake breakdowns.",
};

async function suggestWithModel(
  params: SuggestResourcesParams,
  videos: number,
  articles: number
): Promise<SuggestedResource[]> {
  const system = [
    "You recommend study material for a specific exam topic.",
    "You do NOT have web access, so never invent a URL, video id or page address — you will be given none and asked for none.",
    "Instead name the specific thing worth finding: its likely title, the channel or publication that produces it, and the search query that finds it.",
    "Prefer creators and publications that genuinely cover this exam and this level; name real ones, not placeholders.",
    'Respond with ONLY a JSON array of {"kind":"video"|"article","title":string,"provider":string,"why":string,"minutes":number,"query":string}.',
  ].join(" ");

  const prompt = [
    `Topic: ${params.topicTitle}${params.subjectPath ? ` (${params.subjectPath})` : ""}`,
    params.examName ? `Exam: ${params.examName}` : "",
    params.intent ? INTENT_BRIEF[params.intent] : "",
    "",
    `Suggest ${videos} video(s) and ${articles} article(s) or written references.`,
    "`why` is one sentence on what this resource gives the student that the others don't.",
    "`query` must be the search text that finds it — include the creator's name where that helps.",
    "`minutes` is your estimate of how long it takes to watch or read.",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await generateJson<SuggestedResource[]>({
    system,
    prompt,
    maxTokens: 2048,
  });

  return (Array.isArray(raw) ? raw : [])
    .map((item) => normalize(item, params))
    .filter((item): item is SuggestedResource => item !== null)
    .slice(0, videos + articles);
}

function normalize(
  raw: SuggestedResource,
  params: SuggestResourcesParams
): SuggestedResource | null {
  if (!raw?.title || typeof raw.title !== "string") return null;

  const kind: ResourceKind = raw.kind === "article" ? "article" : "video";
  const title = raw.title.trim();
  const provider =
    typeof raw.provider === "string" && raw.provider.trim()
      ? raw.provider.trim()
      : kind === "video"
        ? "YouTube"
        : "the web";

  // A missing query is recoverable; a wrong link is not. Rebuild it from what
  // we know rather than dropping an otherwise good suggestion.
  const query =
    typeof raw.query === "string" && raw.query.trim()
      ? raw.query.trim()
      : `${title} ${provider} ${params.topicTitle}`.trim();

  const minutes =
    typeof raw.minutes === "number" && Number.isFinite(raw.minutes) && raw.minutes > 0
      ? Math.min(600, Math.round(raw.minutes))
      : undefined;

  return {
    kind,
    title,
    provider,
    why: typeof raw.why === "string" ? raw.why.trim().slice(0, 300) : "",
    minutes,
    query,
    url: buildUrl(kind, provider, query),
  };
}

/**
 * The offline set.
 *
 * Not a placeholder: these are the searches a student would run themselves,
 * against sources that reliably cover school and entrance-exam material. It is
 * a worse list than the model's — it doesn't know which channel is good for
 * this topic — but every entry is real and lands somewhere useful.
 */
function fallbackResources(
  params: SuggestResourcesParams,
  videos: number,
  articles: number
): SuggestedResource[] {
  const subject = params.subjectPath ? ` ${params.subjectPath}` : "";
  const exam = params.examName ? ` ${params.examName}` : "";
  const topic = params.topicTitle;

  const videoSeeds: Omit<SuggestedResource, "url">[] = [
    {
      kind: "video",
      title: `${topic} — full explanation`,
      provider: "YouTube",
      why: "A single lecture covering the whole topic from first principles.",
      query: `${topic}${exam} full chapter explanation`,
    },
    {
      kind: "video",
      title: `${topic} — worked problems`,
      provider: "YouTube",
      why: "Someone solving questions on this topic out loud, which is the fastest way to spot the standard tricks.",
      query: `${topic}${exam} solved problems`,
    },
    {
      kind: "video",
      title: `${topic} — quick revision`,
      provider: "YouTube",
      why: "A short recap for the day before a test.",
      query: `${topic}${exam} revision in one shot`,
    },
  ];

  const articleSeeds: Omit<SuggestedResource, "url">[] = [
    {
      kind: "article",
      title: `${topic} — encyclopaedia entry`,
      provider: "Wikipedia",
      why: "The definitions and the standard notation, stated precisely.",
      query: topic,
    },
    {
      kind: "article",
      title: `${topic} — guided lessons`,
      provider: "Khan Academy",
      why: "Structured practice with immediate feedback, free.",
      query: `${topic}${subject}`,
    },
    {
      kind: "article",
      title: `${topic} — notes and previous-year questions`,
      provider: "the web",
      why: "Written notes pitched at this exam, usually with past questions attached.",
      query: `${topic}${exam} notes previous year questions`,
    },
  ];

  return [
    ...videoSeeds.slice(0, videos),
    ...articleSeeds.slice(0, articles),
  ].map((seed) => ({ ...seed, url: buildUrl(seed.kind, seed.provider, seed.query) }));
}
