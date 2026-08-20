import type { Difficulty, ExamType, QuestionType } from "@prisma/client";

/**
 * One block within a section that shares a question type and marking scheme —
 * JEE Main's "Section A: 20 MCQs (+4/-1)" and "Section B: 5 numerical (+4/-1)".
 *
 * Papers are assembled from these, which is what keeps a generated mock the
 * same shape as the real thing rather than a uniform pile of MCQs.
 */
export interface ExamSectionPart {
  label: string;
  type: QuestionType;
  count: number;
  marksPerCorrect: number;
  negativeMarks: number;
  /** JEE Main Section B historically set 10 and asked for any 5. */
  maxToAttempt?: number;
}

export interface ExamSectionConfig {
  id: string;
  name: string;
  subject: string;
  totalQuestions: number;
  maxToAttempt?: number; // e.g. in JEE Main Section B (attempt 5 out of 10)
  /** Headline marking scheme; per-part values in `parts` win when present. */
  marksPerCorrect: number;
  negativeMarks: number;
  description?: string;
  /**
   * Sectional time limit. CAT and the banking prelims lock you out of a
   * section when its own clock runs down, which changes how the paper is
   * played, so it has to be modelled rather than folded into the total.
   */
  durationMinutes?: number;
  parts?: ExamSectionPart[];
}

export interface ExamPatternConfig {
  examType: ExamType;
  title: string;
  subtitle: string;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  instructions: string[];
  sections: ExamSectionConfig[];
  /** Set when each section runs on its own clock and cannot be revisited. */
  sectionalTiming?: boolean;
}

export interface SimulationQuestion {
  id: string;
  sectionId: string;
  subject: string;
  chapter: string;
  topic?: string;
  type: QuestionType;
  difficulty: Difficulty;
  content: string;
  options?: { label: string; text: string }[];
  /** Comma-separated for multi-select questions, e.g. "A,C". */
  correctAnswer: string;
  solution: string;
  hint?: string;
  marks: number;
  negativeMarks: number;
  year?: number;
  tags?: string[];
  /** Which part of the section this came from, e.g. "Section B — Numerical". */
  partLabel?: string;
  /** Set when the item was written by the model rather than curated. */
  generated?: boolean;
}

export interface SimulationMock {
  id: string;
  slug: string;
  title: string;
  examType: ExamType;
  year?: number;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  sections: ExamSectionConfig[];
  questions: SimulationQuestion[];
  instructions: string[];
  /** Mirrors the pattern: each section runs on its own clock. */
  sectionalTiming?: boolean;
  /**
   * "curated" for the hand-written sample papers, "generated" for a
   * full-length paper built to the exam's pattern for this user.
   */
  origin?: "curated" | "generated";
  /** How many questions came from curated sources rather than the model. */
  curatedCount?: number;
}

export interface ProctoringViolation {
  timestamp: string;
  type: "tab_switch" | "window_blur" | "fullscreen_exit" | "shortcut_blocked";
  details: string;
}

export interface SimulationAttemptResult {
  attemptId: string;
  simulationId: string;
  examType: ExamType;
  title: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  percentile: number;
  accuracy: number;
  timeSpentSec: number;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  proctoringViolations: ProctoringViolation[];
  sectionScores: {
    sectionId: string;
    sectionName: string;
    score: number;
    maxScore: number;
    correct: number;
    incorrect: number;
    unanswered: number;
    accuracy: number;
  }[];
  subjectBreakdown: {
    subject: string;
    score: number;
    maxScore: number;
    accuracy: number;
  }[];
  questionResults: {
    questionId: string;
    sectionId: string;
    subject: string;
    chapter: string;
    content: string;
    type: QuestionType;
    userResponse?: string;
    correctAnswer: string;
    isCorrect: boolean;
    score: number;
    maxScore: number;
    solution: string;
    explanation?: string;
    timeSpentSec?: number;
  }[];
}
