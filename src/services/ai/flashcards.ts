import { generateJson, isAiConfigured } from "./client";
import { formatNotesContext, type RetrievedNote } from "./retrieval";

export interface GeneratedCard {
  front: string;
  back: string;
}

export async function generateFlashcards(params: {
  topicTitle: string;
  notes: RetrievedNote[];
  count: number;
}): Promise<GeneratedCard[]> {
  if (isAiConfigured()) {
    try {
      return await generateWithClaude(params);
    } catch {
      // fall through
    }
  }
  return fallbackCards(params);
}

async function generateWithClaude(params: {
  topicTitle: string;
  notes: RetrievedNote[];
  count: number;
}): Promise<GeneratedCard[]> {
  const context = formatNotesContext(params.notes);
  const system = [
    "You create high-quality spaced-repetition flashcards for StudyForge.",
    "Each card has a focused question 'front' and a concise, correct 'back'.",
    "Prefer atomic facts over broad prompts. Ground cards in the notes when provided.",
    "Respond with ONLY a JSON array of {\"front\": string, \"back\": string}.",
  ].join(" ");

  const prompt = [
    `Topic: ${params.topicTitle}`,
    context ? `\nNotes:\n${context}` : "",
    `\nCreate ${params.count} flashcards.`,
  ]
    .filter(Boolean)
    .join("\n");

  const cards = await generateJson<GeneratedCard[]>({
    system,
    prompt,
    maxTokens: 2048,
  });

  return cards
    .filter((c) => c && c.front && c.back)
    .map((c) => ({ front: c.front.trim(), back: c.back.trim() }))
    .slice(0, params.count);
}

function fallbackCards(params: {
  topicTitle: string;
  notes: RetrievedNote[];
  count: number;
}): GeneratedCard[] {
  const { topicTitle, notes, count } = params;
  const cards: GeneratedCard[] = [];

  // Derive cards from note snippets when available.
  for (const note of notes) {
    if (cards.length >= count) break;
    const firstSentence = note.snippet.split(/(?<=[.!?])\s/)[0]?.trim();
    if (firstSentence && firstSentence.length > 12) {
      cards.push({
        front: `From "${note.title}": what is the key point?`,
        back: firstSentence,
      });
    }
  }

  const templates = [
    {
      front: `What is the core concept of ${topicTitle}?`,
      back: `A concise definition of ${topicTitle}. (Add a Groq API key for notes-generated cards.)`,
    },
    {
      front: `Give one key formula or fact related to ${topicTitle}.`,
      back: `A key formula or fact for ${topicTitle}.`,
    },
    {
      front: `Where is ${topicTitle} commonly applied?`,
      back: `A typical application of ${topicTitle}.`,
    },
  ];
  let t = 0;
  while (cards.length < count) {
    cards.push(templates[t % templates.length]);
    t++;
    if (t > count + templates.length) break;
  }
  return cards.slice(0, count);
}

/* -------------------------------------------------------------------------- */
/*  Revision cards from mistakes                                               */
/* -------------------------------------------------------------------------- */

export interface MissedQuestion {
  content: string;
  correctAnswer?: string | null;
  yourAnswer?: string | null;
  explanation?: string | null;
  topicTitle?: string | null;
}

/**
 * Turns questions a student got wrong into cards.
 *
 * The card must not be the question. Re-showing "what is the radius of
 * curvature when $u = 20$ m/s at $60^\circ$?" teaches the student that one
 * arithmetic path; what they actually missed is the principle underneath it.
 * So the brief is to name the concept and drill that, and to lean on the
 * distractor they fell for, because the wrong answer is the most specific
 * evidence available about where their model broke.
 */
export async function generateRevisionCards(
  missed: MissedQuestion[]
): Promise<GeneratedCard[]> {
  if (missed.length === 0) return [];

  if (isAiConfigured()) {
    try {
      return await revisionCardsWithModel(missed);
    } catch {
      // fall through
    }
  }
  return missed.map(fallbackRevisionCard);
}

async function revisionCardsWithModel(
  missed: MissedQuestion[]
): Promise<GeneratedCard[]> {
  const system = [
    "You turn a student's exam mistakes into spaced-repetition flashcards.",
    "Do not restate the question. Identify the concept, formula or distinction the student actually got wrong, and write a card that drills that.",
    "Where a wrong answer is given, target the specific misconception it reveals.",
    "Fronts are one focused question; backs are two or three sentences with the rule and, where it helps, the trap to avoid.",
    "Write mathematics in LaTeX between single dollar signs.",
    'Respond with ONLY a JSON array of {"front": string, "back": string} — one card per question, in the same order.',
  ].join(" ");

  const prompt = missed
    .map((q, i) =>
      [
        `Question ${i + 1}${q.topicTitle ? ` (${q.topicTitle})` : ""}: ${q.content}`,
        q.correctAnswer ? `Correct answer: ${q.correctAnswer}` : "",
        q.yourAnswer ? `Student answered: ${q.yourAnswer}` : "Student left it blank.",
        q.explanation ? `Worked solution: ${q.explanation}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n");

  const cards = await generateJson<GeneratedCard[]>({
    system,
    prompt,
    maxTokens: 4096,
  });

  const usable = (Array.isArray(cards) ? cards : [])
    .filter((c) => c && c.front && c.back)
    .map((c) => ({ front: String(c.front).trim(), back: String(c.back).trim() }));

  // Never return fewer cards than mistakes — a silently dropped card is a gap
  // the student thinks they have closed.
  return missed.map((q, i) => usable[i] ?? fallbackRevisionCard(q));
}

function fallbackRevisionCard(missed: MissedQuestion): GeneratedCard {
  const back = [
    missed.correctAnswer ? `Correct answer: ${missed.correctAnswer}.` : "",
    missed.explanation?.trim(),
    missed.yourAnswer ? `You answered "${missed.yourAnswer}" — check why that path fails.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    front: missed.topicTitle
      ? `${missed.topicTitle} — you missed this: ${missed.content}`
      : `You missed this: ${missed.content}`,
    back: back || "Review the worked solution for this question and redo it from scratch.",
  };
}
