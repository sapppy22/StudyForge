import { ExamType, TestDurationMode } from "@prisma/client";
import { EXAM_PATTERNS } from "@/data/simulations/patterns";

/**
 * Exam-preference shapes and the pure timing maths.
 *
 * Split out from `services/settings/settingsService` because the CBT player and
 * the quiz both need to resolve a duration in the browser, and that service
 * imports Prisma. Nothing here touches the database.
 */

export type ExamDurationOverrides = Partial<Record<ExamType, number>>;

export interface TestPreferences {
  testDurationMode: TestDurationMode;
  customTestMinutes: number;
  secondsPerQuestion: number;
  examDurations: ExamDurationOverrides;
  quizTimerEnabled: boolean;
  quizSecondsPerQuestion: number;
  autoSubmitOnTimeUp: boolean;
  showTimer: boolean;
  warnAtMinutes: number;
  enforceSectionalTiming: boolean;
  proctoringEnabled: boolean;
  negativeMarkingEnabled: boolean;
}

export const DEFAULT_PREFERENCES: TestPreferences = {
  testDurationMode: TestDurationMode.official,
  customTestMinutes: 60,
  secondsPerQuestion: 90,
  examDurations: {},
  quizTimerEnabled: true,
  quizSecondsPerQuestion: 90,
  autoSubmitOnTimeUp: true,
  showTimer: true,
  warnAtMinutes: 5,
  enforceSectionalTiming: true,
  proctoringEnabled: true,
  negativeMarkingEnabled: true,
};

/** Ceilings, so a typo in the settings form can't produce a 40-hour paper. */
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 600;
export const MIN_SECONDS_PER_QUESTION = 10;
export const MAX_SECONDS_PER_QUESTION = 900;

export const clampMinutes = (value: number) =>
  Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(value)));

export interface ResolvedDuration {
  minutes: number;
  /** Where the number came from, so the UI can say so rather than just show it. */
  source: "exam-override" | "custom" | "per-question" | "official";
  officialMinutes: number;
}

/**
 * The clock for one paper.
 *
 * A per-exam override is the most specific instruction a student can give, so
 * it wins outright. Otherwise the chosen mode applies, and `official` — the
 * default — hands back the board's own duration untouched, which is what makes
 * an untouched install a faithful simulation.
 */
export function resolveTestDuration(params: {
  preferences: TestPreferences;
  examType: ExamType;
  questionCount: number;
  /** The paper's own duration; defaults to the exam pattern's. */
  officialMinutes?: number;
}): ResolvedDuration {
  const { preferences, examType, questionCount } = params;
  const officialMinutes =
    params.officialMinutes ?? EXAM_PATTERNS[examType]?.durationMinutes ?? 60;

  const override = preferences.examDurations?.[examType];
  if (override) {
    return { minutes: clampMinutes(override), source: "exam-override", officialMinutes };
  }

  switch (preferences.testDurationMode) {
    case TestDurationMode.custom:
      return {
        minutes: clampMinutes(preferences.customTestMinutes),
        source: "custom",
        officialMinutes,
      };
    case TestDurationMode.per_question:
      return {
        minutes: clampMinutes(
          (Math.max(1, questionCount) * preferences.secondsPerQuestion) / 60
        ),
        source: "per-question",
        officialMinutes,
      };
    default:
      return { minutes: officialMinutes, source: "official", officialMinutes };
  }
}

/**
 * The clock for a topic quiz.
 *
 * Quizzes have no published duration to inherit, so they are always budgeted
 * per question — a 5-question quiz should not get the same clock as a 30-
 * question one. Returns null when the student has turned the quiz timer off.
 */
export function resolveQuizDuration(
  preferences: TestPreferences,
  questionCount: number
): number | null {
  if (!preferences.quizTimerEnabled) return null;
  const seconds = Math.max(1, questionCount) * preferences.quizSecondsPerQuestion;
  return clampMinutes(seconds / 60);
}
