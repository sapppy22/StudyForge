import type { Difficulty, ExamType, QuestionType } from "@prisma/client";

/**
 * One curated practice problem, as authored in the seed files.
 *
 * The bank is deliberately *subjective*: you read the problem, solve it on
 * paper, then reveal the worked approach and tick it off yourself — the same
 * loop as a DSA sheet. `correctAnswer` is the final value to check against, not
 * something the app auto-grades.
 */
export interface BankSeed {
  /** Stable key — re-seeding upserts on this, so never renumber existing ones. */
  slug: string;
  examType: ExamType;
  subject: string;
  chapter: string;
  topic?: string;
  type: QuestionType;
  difficulty: Difficulty;
  content: string;
  /** The final answer, for self-checking. */
  correctAnswer?: string;
  /** Worked approach, revealed on demand. */
  solution?: string;
  hint?: string;
  marks?: number;
  /** Target solve time in minutes — the timer benchmarks against this. */
  expectedMinutes?: number;
  year?: number;
  tags?: string[];
}

/**
 * Reference material used to build the bank's taxonomy: which chapters carry
 * the most marks, and the official pattern each sheet is ordered against.
 * Surfaced in the UI so the ordering is auditable rather than arbitrary.
 */
export interface BankSource {
  examType: ExamType;
  label: string;
  url: string;
}
