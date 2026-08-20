import { Difficulty, QuestionType, type ExamType } from "@prisma/client";
import { generateJson, isAiConfigured } from "./client";
import { examEntry } from "@/data/exams/catalog";

/**
 * Question generation for full-length mock papers.
 *
 * Distinct from `ai/questions`, which writes a handful of items grounded in one
 * student's notes. Here the brief is the opposite: produce a whole paper in the
 * house style of a named exam — its question types, its marking scheme, its
 * chapters, and the previous-year flavour students actually recognise — for a
 * section at a time.
 *
 * Every path returns exactly the number of questions asked for. A paper that
 * silently comes up eleven questions short is not a simulation of anything, so
 * shortfalls are filled deterministically rather than left as gaps.
 */

export interface GeneratedExamQuestion {
  content: string;
  options?: { label: string; text: string }[];
  correctAnswer: string;
  solution: string;
  hint?: string;
  chapter: string;
  topic?: string;
  difficulty: Difficulty;
  year?: number;
}

export interface ExamQuestionRequest {
  examType: ExamType;
  /** Section subject, e.g. "Physics" or "Quantitative Aptitude". */
  subject: string;
  /** Chapters to spread the questions across, from the exam's syllabus. */
  chapters: string[];
  type: QuestionType;
  count: number;
  marksPerCorrect: number;
  negativeMarks: number;
  /** The part's own label, e.g. "Section B — Numerical value". */
  partLabel: string;
}

/** One model call per this many questions — long JSON arrays degrade badly. */
const BATCH_SIZE = 12;

/**
 * Ceiling on model calls in flight.
 *
 * A NEET paper is 180 questions across four sections; fanning every batch out
 * at once would put fifteen-plus concurrent requests on the provider and earn a
 * rate limit rather than a paper. Four at a time keeps a full paper well inside
 * a minute without tripping anything.
 */
const MAX_CONCURRENT_CALLS = 4;

let inFlight = 0;
const waiting: (() => void)[] = [];

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (inFlight >= MAX_CONCURRENT_CALLS) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  inFlight += 1;
  try {
    return await task();
  } finally {
    inFlight -= 1;
    waiting.shift()?.();
  }
}

const DIFFICULTY_CYCLE: Difficulty[] = [
  Difficulty.easy,
  Difficulty.medium,
  Difficulty.medium,
  Difficulty.hard,
];

const OPTION_LABELS = ["A", "B", "C", "D", "E"];

function typeBrief(type: QuestionType): string {
  switch (type) {
    case QuestionType.numeric:
      return "Numerical-answer questions. No options. `correctAnswer` is the numeric value alone, e.g. \"12.5\".";
    case QuestionType.msq:
      return "Multiple-select questions with four options where two or three are correct. `correctAnswer` lists the correct labels comma-separated in alphabetical order, e.g. \"A,C\".";
    case QuestionType.short_answer:
      return "Short-answer questions answerable in a sentence or a single value. No options. `correctAnswer` is the model answer.";
    case QuestionType.long_answer:
      return "One extended written task (an essay or a structured answer). No options. `correctAnswer` is a model answer of 120-200 words.";
    default:
      return "Single-correct multiple choice with exactly four options labelled A-D. `correctAnswer` is the one correct label.";
  }
}

export async function generateExamQuestions(
  request: ExamQuestionRequest
): Promise<GeneratedExamQuestion[]> {
  if (request.count <= 0) return [];

  if (isAiConfigured()) {
    try {
      const batches: Promise<GeneratedExamQuestion[]>[] = [];
      for (let offset = 0; offset < request.count; offset += BATCH_SIZE) {
        const size = Math.min(BATCH_SIZE, request.count - offset);
        batches.push(withSlot(() => generateBatch(request, size, offset)));
      }
      const generated = (await Promise.all(batches)).flat();
      if (generated.length >= request.count) return generated.slice(0, request.count);
      // A partial answer is still worth keeping; top the rest up deterministically.
      return [...generated, ...placeholders(request, request.count - generated.length, generated.length)];
    } catch {
      // fall through to the offline paper
    }
  }

  return placeholders(request, request.count, 0);
}

async function generateBatch(
  request: ExamQuestionRequest,
  size: number,
  offset: number
): Promise<GeneratedExamQuestion[]> {
  const exam = examEntry(request.examType);
  const examName = exam?.fullName ?? String(request.examType).replace(/_/g, " ");

  const system = [
    `You are a senior paper-setter for ${examName}.`,
    "Write questions indistinguishable from that exam's real papers: same phrasing conventions, same difficulty spread, same traps.",
    "Favour the styles that recur in previous years' papers for this exam and subject.",
    "Write all mathematics, units and chemical formulae in LaTeX between single dollar signs, e.g. $\\frac{v^2}{r}$, $\\text{m s}^{-1}$, $\\mathrm{H_2SO_4}$.",
    "Every question must have exactly one defensible answer and a worked solution that shows the steps.",
    "Respond with ONLY a JSON array — no prose, no code fences.",
  ].join(" ");

  // Rotating the chapter offset per batch stops every batch opening on the
  // same chapter, which is what made generated papers feel repetitive.
  const rotated = request.chapters.length
    ? request.chapters.slice(offset % request.chapters.length).concat(
        request.chapters.slice(0, offset % request.chapters.length)
      )
    : [];

  const prompt = [
    `Exam: ${examName}`,
    `Section: ${request.subject}`,
    `Part: ${request.partLabel} (+${request.marksPerCorrect}${
      request.negativeMarks ? ` / -${request.negativeMarks}` : ", no negative marking"
    })`,
    rotated.length ? `Spread the questions across these chapters, in this order: ${rotated.join(", ")}.` : "",
    "",
    `Write ${size} question(s).`,
    typeBrief(request.type),
    "Mix difficulty roughly 30% easy, 50% medium, 20% hard.",
    "",
    "Schema for each element:",
    `{
  "content": string,                      // the question, LaTeX for any maths
  "options": [{"label":"A","text":"..."}] // only for multiple choice / multi-select
  "correctAnswer": string,
  "solution": string,                     // worked steps, LaTeX for any maths
  "hint": string,
  "chapter": string,                      // one of the chapters listed above
  "topic": string,
  "difficulty": "easy" | "medium" | "hard"
}`,
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await generateJson<GeneratedExamQuestion[]>({
    system,
    prompt,
    maxTokens: 16000,
  });

  return (Array.isArray(raw) ? raw : [])
    .map((q) => normalize(q, request))
    .filter((q): q is GeneratedExamQuestion => q !== null)
    .slice(0, size);
}

function normalize(
  raw: GeneratedExamQuestion,
  request: ExamQuestionRequest
): GeneratedExamQuestion | null {
  if (!raw?.content || typeof raw.content !== "string") return null;

  const difficulty = (
    [Difficulty.easy, Difficulty.medium, Difficulty.hard] as Difficulty[]
  ).includes(raw.difficulty)
    ? raw.difficulty
    : Difficulty.medium;

  const chapter =
    typeof raw.chapter === "string" && raw.chapter.trim()
      ? raw.chapter.trim()
      : (request.chapters[0] ?? request.subject);

  const base = {
    content: raw.content.trim(),
    solution: typeof raw.solution === "string" ? raw.solution.trim() : "",
    hint: typeof raw.hint === "string" ? raw.hint.trim() : undefined,
    chapter,
    topic: typeof raw.topic === "string" ? raw.topic.trim() : undefined,
    difficulty,
  };

  const needsOptions =
    request.type === QuestionType.mcq || request.type === QuestionType.msq;

  if (!needsOptions) {
    const answer = String(raw.correctAnswer ?? "").trim();
    if (!answer) return null;
    return { ...base, correctAnswer: answer };
  }

  const options = (Array.isArray(raw.options) ? raw.options : [])
    .filter((o) => o && typeof o.text === "string")
    .slice(0, 5)
    // Models sometimes label options "1"/"a"; relabel so the answer key and the
    // buttons can never disagree.
    .map((o, i) => ({ label: OPTION_LABELS[i], text: String(o.text).trim() }));

  if (options.length < 2) return null;

  const validLabels = new Set(options.map((o) => o.label));
  const answers = String(raw.correctAnswer ?? "")
    .split(",")
    .map((a) => a.trim().toUpperCase())
    .filter((a) => validLabels.has(a));

  if (answers.length === 0) return null;
  if (request.type === QuestionType.mcq && answers.length > 1) {
    // A "single correct" question with two keys is broken; keep the first.
    answers.length = 1;
  }

  return { ...base, options, correctAnswer: answers.sort().join(",") };
}

/**
 * Deterministic filler so a paper is always its full published length.
 *
 * These are honestly labelled in the UI as unsourced — a student without an API
 * key still gets the real question count, section layout, marking scheme and
 * clock, which is most of what a mock is for.
 */
function placeholders(
  request: ExamQuestionRequest,
  count: number,
  startIndex: number
): GeneratedExamQuestion[] {
  const out: GeneratedExamQuestion[] = [];

  for (let i = 0; i < count; i += 1) {
    const index = startIndex + i;
    const chapter = request.chapters.length
      ? request.chapters[index % request.chapters.length]
      : request.subject;
    const difficulty = DIFFICULTY_CYCLE[index % DIFFICULTY_CYCLE.length];
    const number = index + 1;

    if (request.type === QuestionType.mcq || request.type === QuestionType.msq) {
      out.push({
        content: `${chapter}: recall the standard result most often examined in this chapter (paper slot ${number}). Connect a Groq API key to fill this slot with a written question.`,
        options: OPTION_LABELS.slice(0, 4).map((label, optIndex) => ({
          label,
          text:
            optIndex === 0
              ? `The standard result for ${chapter}`
              : `A distractor for ${chapter} (${optIndex})`,
        })),
        correctAnswer: request.type === QuestionType.msq ? "A,B" : "A",
        solution: `This slot mirrors a real ${chapter} question in the ${request.partLabel} part. Add a Groq API key in Settings to generate the full paper.`,
        chapter,
        difficulty,
      });
      continue;
    }

    if (request.type === QuestionType.numeric) {
      out.push({
        content: `${chapter}: compute the quantity this chapter's standard numerical asks for (paper slot ${number}). Connect a Groq API key to fill this slot.`,
        correctAnswer: String(number),
        solution: `Numerical slot for ${chapter}. Add a Groq API key in Settings to generate the full paper.`,
        chapter,
        difficulty,
      });
      continue;
    }

    out.push({
      content: `${chapter}: write the answer this chapter's standard ${
        request.type === QuestionType.long_answer ? "extended" : "short"
      } question calls for (paper slot ${number}).`,
      correctAnswer: `A complete answer covers the core definitions of ${chapter}, the reasoning, and a worked example.`,
      solution: `Written slot for ${chapter}. Add a Groq API key in Settings to generate the full paper.`,
      chapter,
      difficulty,
    });
  }

  return out;
}
