import { generateJson, isAiConfigured } from "./client";

export interface GradeResult {
  score: number;
  maxScore: number;
  isCorrect: boolean | null;
  feedback: string;
}

export interface GradeParams {
  question: string;
  rubric?: { criteria: string[] } | null;
  modelAnswer?: string | null;
  response: string;
  maxScore: number;
}

export async function gradeSubjective(params: GradeParams): Promise<GradeResult> {
  const trimmed = params.response.trim();
  if (!trimmed) {
    return {
      score: 0,
      maxScore: params.maxScore,
      isCorrect: false,
      feedback: "No answer was provided.",
    };
  }

  if (isAiConfigured()) {
    try {
      return await gradeWithClaude(params, trimmed);
    } catch {
      // fall through
    }
  }
  return fallbackGrade(params, trimmed);
}

async function gradeWithClaude(
  params: GradeParams,
  response: string
): Promise<GradeResult> {
  const system = [
    "You are a fair, encouraging exam grader for StudyForge.",
    "Grade the student's answer against the rubric and model answer.",
    "Return ONLY JSON: {\"score\": <integer 0..max>, \"feedback\": <2-3 sentence constructive feedback>}.",
  ].join(" ");

  const prompt = [
    `Question: ${params.question}`,
    params.rubric?.criteria?.length
      ? `Rubric criteria:\n- ${params.rubric.criteria.join("\n- ")}`
      : "",
    params.modelAnswer ? `Model answer: ${params.modelAnswer}` : "",
    `Maximum score: ${params.maxScore}`,
    `\nStudent's answer:\n${response}`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await generateJson<{ score: number; feedback: string }>({
    system,
    prompt,
    maxTokens: 1024,
  });

  const score = clamp(Math.round(result.score ?? 0), 0, params.maxScore);
  return {
    score,
    maxScore: params.maxScore,
    isCorrect: score >= params.maxScore * 0.6,
    feedback: result.feedback?.trim() || "Graded.",
  };
}

/**
 * Heuristic offline grading: rewards coverage of rubric keywords and adequate
 * length. Clearly labelled as an estimate so users know to add an API key for
 * real rubric-based grading.
 */
function fallbackGrade(params: GradeParams, response: string): GradeResult {
  const words = response.split(/\s+/).filter(Boolean);
  const criteria = params.rubric?.criteria ?? [];
  const keywords = [
    ...criteria.flatMap((c) => c.toLowerCase().split(/\s+/)),
    ...(params.modelAnswer ?? "").toLowerCase().split(/\s+/),
  ].filter((w) => w.length > 4);

  const lower = response.toLowerCase();
  const uniqueKeywords = Array.from(new Set(keywords));
  const hits = uniqueKeywords.filter((k) => lower.includes(k)).length;
  const coverage = uniqueKeywords.length > 0 ? hits / uniqueKeywords.length : 0;

  // Length signal: answers under ~15 words are unlikely to be complete.
  const lengthSignal = Math.min(1, words.length / 40);

  const ratio = 0.35 + 0.4 * coverage + 0.25 * lengthSignal; // 0.35..1.0 range
  const score = clamp(Math.round(ratio * params.maxScore), 0, params.maxScore);

  return {
    score,
    maxScore: params.maxScore,
    isCorrect: score >= params.maxScore * 0.6,
    feedback:
      "Automated estimate based on rubric keyword coverage and answer depth. " +
      "Add a Groq API key for detailed, rubric-based grading.",
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
