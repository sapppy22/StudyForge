import type { Difficulty, ExamType, QuestionType } from "@prisma/client";

export interface ExamSectionConfig {
  id: string;
  name: string;
  subject: string;
  totalQuestions: number;
  maxToAttempt?: number; // e.g. in JEE Main Section B (attempt 5 out of 10)
  marksPerCorrect: number;
  negativeMarks: number;
  description?: string;
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
  correctAnswer: string;
  solution: string;
  hint?: string;
  marks: number;
  negativeMarks: number;
  year?: number;
  tags?: string[];
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
