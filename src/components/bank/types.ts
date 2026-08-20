/** Wire shapes returned by `GET /api/bank`. */

export interface BankProgressRow {
  solved: boolean;
  bookmarked: boolean;
  attempts: number;
  timeSpentSec: number;
  bestTimeSec: number | null;
  notes: string | null;
}

export interface BankRow {
  id: string;
  slug: string;
  subject: string;
  chapter: string;
  topic: string | null;
  difficulty: "easy" | "medium" | "hard";
  type: string;
  content: string;
  /** Present on objective questions; null for written work. */
  options: { label: string; text: string }[] | null;
  correctAnswer: string | null;
  solution: string | null;
  hint: string | null;
  expectedMinutes: number;
  marks: number;
  tags: string[];
  /** Zero or one row — the query filters to the current user. */
  progress: BankProgressRow[];
}

export interface BankStats {
  total: number;
  solved: number;
  byDifficulty: { easy: number; medium: number; hard: number };
  totalByDifficulty: { easy: number; medium: number; hard: number };
  byKind: { objective: number; subjective: number };
  bySubject: { subject: string; total: number; solved: number }[];
  totalTimeSec: number;
}

export interface BankTaxonomy {
  subject: string;
  chapters: string[];
}

export interface BankResponse {
  questions: BankRow[];
  taxonomy: BankTaxonomy[];
  stats: BankStats;
}
