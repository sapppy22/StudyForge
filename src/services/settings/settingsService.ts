import { prisma } from "@/db/prisma";
import { ExamType, type Prisma, type UserSettings } from "@prisma/client";
import {
  DEFAULT_PREFERENCES,
  MAX_MINUTES,
  MAX_SECONDS_PER_QUESTION,
  MIN_MINUTES,
  MIN_SECONDS_PER_QUESTION,
  type ExamDurationOverrides,
  type TestPreferences,
} from "@/lib/test-timing";

/**
 * Persistence for exam preferences.
 *
 * The timing maths lives in `lib/test-timing` because the CBT player and the
 * quiz resolve durations in the browser and must not pull Prisma in with them;
 * it is re-exported here so server callers have one import.
 */
export {
  DEFAULT_PREFERENCES,
  resolveQuizDuration,
  resolveTestDuration,
  type ExamDurationOverrides,
  type ResolvedDuration,
  type TestPreferences,
} from "@/lib/test-timing";

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
    ...(update.autoSubmitOnTimeUp !== undefined && {
      autoSubmitOnTimeUp: update.autoSubmitOnTimeUp,
    }),
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
