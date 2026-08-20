import { prisma } from "@/db/prisma";
import { ExamType, TestDurationMode, type Prisma, type UserSettings } from "@prisma/client";
import { EXAM_PATTERNS } from "@/data/simulations/patterns";

/**
 * Exam preferences, and the one place that answers "how long does this run?".
 *
 * Every clock in the app — the CBT mock, a topic quiz, a sectional lock —
 * resolves through `resolveTestDuration` so a student's settings apply
 * everywhere rather than only wherever a timer happened to be wired up.
 */

/** Ceilings, so a typo in the settings form can't produce a 40-hour paper. */
const MIN_MINUTES = 1;
const MAX_MINUTES = 600;
const MIN_SECONDS_PER_QUESTION = 10;
const MAX_SECONDS_PER_QUESTION = 900;

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

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)));

/** Drops unknown keys and out-of-range minutes from the stored JSON blob. */
function parseOverrides(raw: Prisma.JsonValue | null): ExamDurationOverrides {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: ExamDurationOverrides = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!(key in ExamType)) continue;
    const minutes = Number(value);
    if (!Number.isFinite(minutes) || minutes <= 0) continue;
    out[key as ExamType] = clamp(minutes, MIN_MINUTES, MAX_MINUTES);
  }
  return out;
}

function toPreferences(row: UserSettings): TestPreferences {
  return {
    testDurationMode: row.testDurationMode,
    customTestMinutes: row.customTestMinutes,
    secondsPerQuestion: row.secondsPerQuestion,
    examDurations: parseOverrides(row.examDurations),
    quizTimerEnabled: row.quizTimerEnabled,
    quizSecondsPerQuestion: row.quizSecondsPerQuestion,
    autoSubmitOnTimeUp: row.autoSubmitOnTimeUp,
    showTimer: row.showTimer,
    warnAtMinutes: row.warnAtMinutes,
    enforceSectionalTiming: row.enforceSectionalTiming,
    proctoringEnabled: row.proctoringEnabled,
    negativeMarkingEnabled: row.negativeMarkingEnabled,
  };
}

/**
 * Reads a user's preferences, falling back to the defaults.
 *
 * Deliberately does not create the row: settings are read on almost every test
 * start, and a write on each of those would be pure overhead for the majority
 * of users who never change anything. The row appears on first save.
 */
export async function getPreferences(userId: string): Promise<TestPreferences> {
  const row = await prisma.userSettings.findUnique({ where: { userId } });
  return row ? toPreferences(row) : DEFAULT_PREFERENCES;
}

export type PreferencesUpdate = Partial<TestPreferences>;

export async function savePreferences(
  userId: string,
  update: PreferencesUpdate
): Promise<TestPreferences> {
  const data = {
    ...(update.testDurationMode !== undefined && { testDurationMode: update.testDurationMode }),
    ...(update.customTestMinutes !== undefined && {
      customTestMinutes: clamp(update.customTestMinutes, MIN_MINUTES, MAX_MINUTES),
    }),
    ...(update.secondsPerQuestion !== undefined && {
      secondsPerQuestion: clamp(
        update.secondsPerQuestion,
        MIN_SECONDS_PER_QUESTION,
        MAX_SECONDS_PER_QUESTION
      ),
    }),
    ...(update.examDurations !== undefined && {
      examDurations: update.examDurations as Prisma.InputJsonValue,
    }),
    ...(update.quizTimerEnabled !== undefined && { quizTimerEnabled: update.quizTimerEnabled }),
    ...(update.quizSecondsPerQuestion !== undefined && {
      quizSecondsPerQuestion: clamp(
        update.quizSecondsPerQuestion,
        MIN_SECONDS_PER_QUESTION,
        MAX_SECONDS_PER_QUESTION
      ),
    }),
    ...(update.autoSubmitOnTimeUp !== undefined && { autoSubmitOnTimeUp: update.autoSubmitOnTimeUp }),
    ...(update.showTimer !== undefined && { showTimer: update.showTimer }),
    ...(update.warnAtMinutes !== undefined && {
      warnAtMinutes: clamp(update.warnAtMinutes, 0, 60),
    }),
    ...(update.enforceSectionalTiming !== undefined && {
      enforceSectionalTiming: update.enforceSectionalTiming,
    }),
    ...(update.proctoringEnabled !== undefined && { proctoringEnabled: update.proctoringEnabled }),
    ...(update.negativeMarkingEnabled !== undefined && {
      negativeMarkingEnabled: update.negativeMarkingEnabled,
    }),
  };

  const row = await prisma.userSettings.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
  return toPreferences(row);
}

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

  const override = preferences.examDurations[examType];
  if (override) {
    return { minutes: clamp(override, MIN_MINUTES, MAX_MINUTES), source: "exam-override", officialMinutes };
  }

  switch (preferences.testDurationMode) {
    case TestDurationMode.custom:
      return {
        minutes: clamp(preferences.customTestMinutes, MIN_MINUTES, MAX_MINUTES),
        source: "custom",
        officialMinutes,
      };
    case TestDurationMode.per_question:
      return {
        minutes: clamp(
          (Math.max(1, questionCount) * preferences.secondsPerQuestion) / 60,
          MIN_MINUTES,
          MAX_MINUTES
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
  return clamp(seconds / 60, MIN_MINUTES, MAX_MINUTES);
}
