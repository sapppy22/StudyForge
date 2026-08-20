import type { Difficulty, ExamType, QuestionType } from "@prisma/client";

/**
 * One curated practice problem, as authored in the seed files.
 *
 * The sheet carries both halves of a real paper. Written work — derivations,
 * numericals, long answers — is solved on paper, then checked against the
 * revealed approach and ticked off, the same loop as a DSA sheet. Objective
 * questions carry `options` and are answered in place. Either way
 * `correctAnswer` is what you check yourself against; nothing here is
 * auto-graded.
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
  /** Four choices for an objective question; absent for written work. */
  options?: { label: string; text: string }[];
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
