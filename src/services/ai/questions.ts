import { generateJson, isAiConfigured } from "./client";
import { formatNotesContext, type RetrievedNote } from "./retrieval";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface GeneratedQuestion {
  kind: "objective" | "subjective";
  type: "mcq" | "short_answer";
  difficulty: QuestionDifficulty;
  content: string;
  options?: { label: string; text: string }[];
  correctAnswer?: string;
  rubric?: { criteria: string[] };
  explanation?: string;
  grounded: boolean;
}

export interface GenerateQuestionsParams {
  topicTitle: string;
  subjectPath?: string;
  notes: RetrievedNote[];
  objective: number;
  subjective: number;
  difficulty: QuestionDifficulty | "adaptive";
  reason?: string;
}

const DIFF_CYCLE: QuestionDifficulty[] = ["easy", "medium", "hard"];

export async function generateQuestions(
  params: GenerateQuestionsParams
): Promise<GeneratedQuestion[]> {
  if (isAiConfigured()) {
    try {
      return await generateWithClaude(params);
    } catch {
      // fall through to deterministic generation
    }
  }
  return fallbackQuestions(params);
}

async function generateWithClaude(
  params: GenerateQuestionsParams
): Promise<GeneratedQuestion[]> {
  const context = formatNotesContext(params.notes);
  const grounded = params.notes.length > 0;
  const difficultyInstruction =
    params.difficulty === "adaptive"
      ? "Mix difficulties (easy, medium, hard) sensibly across the set."
      : `Target ${params.difficulty} difficulty.`;

  const system = [
    "You are an expert exam-question author for StudyForge, an adaptive study platform.",
    "Write accurate, unambiguous questions with exactly one correct answer for MCQs.",
    "Ground questions in the provided notes when notes are given; otherwise use standard curriculum knowledge.",
    "Respond with ONLY a JSON array — no prose, no code fences.",
  ].join(" ");

  const schema = `Each element must match:
{
  "kind": "objective" | "subjective",
  "type": "mcq" (for objective) | "short_answer" (for subjective),
  "difficulty": "easy" | "medium" | "hard",
  "content": string,                       // the question text
  "options": [{"label":"A","text":"..."}, ...4 for mcq only],
  "correctAnswer": "A",                    // mcq only, matches an option label
  "rubric": {"criteria": ["...", "..."]},  // short_answer only
  "explanation": string                    // concise worked explanation / model answer
}`;

  const prompt = [
    `Topic: ${params.topicTitle}${params.subjectPath ? ` (${params.subjectPath})` : ""}`,
    params.reason ? `Focus/reason: ${params.reason}` : "",
    context ? `\nStudent's notes to ground questions in:\n${context}` : "",
    `\nGenerate ${params.objective} objective (MCQ, 4 options A–D) and ${params.subjective} subjective (short_answer with a rubric) question(s).`,
    difficultyInstruction,
    `\nSchema:\n${schema}`,
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await generateJson<GeneratedQuestion[]>({
    system,
    prompt,
    maxTokens: 4096,
  });

  return raw
    .map((q) => normalizeQuestion(q, grounded))
    .filter((q): q is GeneratedQuestion => q !== null)
    .slice(0, params.objective + params.subjective);
}

function normalizeQuestion(
  q: GeneratedQuestion,
  grounded: boolean
): GeneratedQuestion | null {
  if (!q || !q.content) return null;
  const difficulty: QuestionDifficulty = DIFF_CYCLE.includes(q.difficulty)
    ? q.difficulty
    : "medium";
  if (q.type === "mcq") {
    const options = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
    if (options.length < 2 || !q.correctAnswer) return null;
    return {
      kind: "objective",
      type: "mcq",
      difficulty,
      content: q.content,
      options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation ?? "",
      grounded,
    };
  }
  return {
    kind: "subjective",
    type: "short_answer",
    difficulty,
    content: q.content,
    rubric: q.rubric ?? { criteria: ["Conceptual accuracy", "Completeness"] },
    explanation: q.explanation ?? "",
    grounded,
  };
}

/**
 * Deterministic offline generator. Produces usable practice items that
 * exercise the full test/grade flow without an API key. Uses the student's
 * notes when available so questions aren't pure boilerplate.
 */
function fallbackQuestions(
  params: GenerateQuestionsParams
): GeneratedQuestion[] {
  const { topicTitle, notes } = params;
  const grounded = notes.length > 0;
  const questions: GeneratedQuestion[] = [];
  const noteHint = notes[0]?.snippet?.split(/[.\n]/)[0]?.trim();

  for (let i = 0; i < params.objective; i++) {
    const difficulty =
      params.difficulty === "adaptive"
        ? DIFF_CYCLE[i % DIFF_CYCLE.length]
        : params.difficulty;
    questions.push({
      kind: "objective",
      type: "mcq",
      difficulty,
      content: `Which statement best captures a key idea in "${topicTitle}"?`,
      options: [
        {
          label: "A",
          text: noteHint
            ? `${noteHint}`
            : `A core principle underpinning ${topicTitle}.`,
        },
        { label: "B", text: `An idea unrelated to ${topicTitle}.` },
        { label: "C", text: `A common misconception about ${topicTitle}.` },
        { label: "D", text: `None of the above.` },
      ],
      correctAnswer: "A",
      explanation: `Option A reflects the central concept of ${topicTitle}. Add a Groq API key to generate richer, notes-grounded questions.`,
      grounded,
    });
  }

  for (let i = 0; i < params.subjective; i++) {
    const difficulty =
      params.difficulty === "adaptive"
        ? DIFF_CYCLE[(i + 1) % DIFF_CYCLE.length]
        : params.difficulty;
    questions.push({
      kind: "subjective",
      type: "short_answer",
      difficulty,
      content: `Explain the core concept of "${topicTitle}" in your own words, and give one concrete example.`,
      rubric: {
        criteria: [
          `Correctly defines ${topicTitle}`,
          "Uses accurate terminology",
          "Provides a relevant example",
        ],
      },
      explanation: `A strong answer defines ${topicTitle} precisely and illustrates it with an example.`,
      grounded,
    });
  }

  return questions;
}
