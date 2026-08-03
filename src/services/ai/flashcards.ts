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
      back: `A concise definition of ${topicTitle}. (Add an Anthropic API key for notes-generated cards.)`,
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
