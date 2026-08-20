import { StudyTaskKind, TopicStatus } from "@prisma/client";

/**
 * The scheduling core: how a syllabus becomes a day-by-day plan.
 *
 * Pure by design — no database, no clock, no model. Everything it needs comes
 * in as arguments, which is what makes a plan reproducible: the same topics and
 * the same budget always produce the same schedule, so "why is this here?" has
 * an answer a student can check.
 */

export const DEFAULT_DAILY_MINUTES = 60;
export const DEFAULT_HORIZON_DAYS = 14;
export const MAX_HORIZON_DAYS = 60;
/** A topic with no test history is assumed mid-weak — worth covering, not urgent. */
export const UNTESTED_WEAKNESS = 60;
/** Mock test cadence, in days. */
export const TEST_EVERY = 7;
/** Below this, a block is too short to be worth sitting down for. */
export const MIN_BLOCK_MINUTES = 15;
/** The run-in to the exam is revision, not new material. */
export const REVISION_RUN_IN_DAYS = 3;

export const MINUTES_BY_KIND: Record<StudyTaskKind, number> = {
  learn: 45,
  practice: 30,
  revise: 20,
  test: 30,
};

/** Status nudges the raw weakness score: unlearned material outranks a review. */
export const STATUS_MULTIPLIER: Record<TopicStatus, number> = {
  not_started: 1.15,
  learning: 1.1,
  reviewing: 0.95,
  mastered: 0.5,
};

/**
 * What a topic asks for on its first, second, third… appearance in the plan.
 *
 * A plan that schedules "Practice: Rotational Motion" eight times is not a
 * plan, it is a reminder. The progression is what makes repeat visits
 * different work: learn it, drill it, then keep it alive with short reviews.
 */
const KIND_PROGRESSION: Record<TopicStatus, StudyTaskKind[]> = {
  not_started: [StudyTaskKind.learn, StudyTaskKind.practice, StudyTaskKind.revise],
  learning: [StudyTaskKind.practice, StudyTaskKind.learn, StudyTaskKind.revise],
  reviewing: [StudyTaskKind.revise, StudyTaskKind.practice, StudyTaskKind.revise],
  mastered: [StudyTaskKind.revise, StudyTaskKind.practice],
};

export interface Candidate {
  topicId: string;
  title: string;
  status: TopicStatus;
  proficiency: number | null;
  priority: number;
  /** Syllabus position — the stable tiebreak when priorities are equal. */
  orderIndex: number;
}

/* -------------------------------------------------------------------------- */
/*  Dates                                                                      */
/* -------------------------------------------------------------------------- */

/** Normalizes to UTC midnight so day grouping is stable across timezones. */
export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/* -------------------------------------------------------------------------- */
/*  Prioritisation                                                             */
/* -------------------------------------------------------------------------- */

/**
 * How far a topic sits below mastery, scaled by its syllabus weight and nudged
 * by its status. Higher means more urgent.
 */
export function priorityFor(params: {
  proficiency: number | null;
  status: TopicStatus;
  weight: number;
}): number {
  const weakness =
    params.proficiency === null ? UNTESTED_WEAKNESS : 100 - params.proficiency;
  return Math.round(weakness * STATUS_MULTIPLIER[params.status] * (params.weight || 1));
}

/**
 * Decides how many days to plan for.
 *
 * An exam date caps the horizon — planning past the exam is planning for
 * nobody. A date that has already passed used to fall through to the 60-day
 * maximum, which produced a two-month plan for an exam last week; it now
 * produces a short plan instead, on the assumption the date is stale rather
 * than the student being finished.
 */
export function resolveHorizon(
  requested: number | undefined,
  daysUntilExam: number | null
): number {
  const asked = Math.min(requested ?? DEFAULT_HORIZON_DAYS, MAX_HORIZON_DAYS);
  if (daysUntilExam === null) return Math.max(1, asked);
  if (daysUntilExam <= 0) return Math.min(asked, 7);
  return Math.max(1, Math.min(asked, daysUntilExam));
}

/* -------------------------------------------------------------------------- */
/*  Scheduling                                                                 */
/* -------------------------------------------------------------------------- */

export interface ScheduledTask {
  topicId: string | null;
  title: string;
  kind: StudyTaskKind;
  minutes: number;
  scheduledFor: Date;
  orderIndex: number;
  priority: number;
}

interface ScheduleParams {
  candidates: Candidate[];
  startDay: Date;
  horizonDays: number;
  dailyMinutes: number;
  /** Day offset of the first scheduled day, so test cadence survives a rewrite. */
  dayOffset: number;
  /** Days from `startDay` to the exam, when one is set. */
  daysUntilExam: number | null;
  /** Minutes already committed on a given day by work the student has done. */
  committedMinutes?: Map<string, number>;
  /** Where to continue numbering on a day that already has blocks. */
  startOrderIndex?: Map<string, number>;
}

/**
 * Packs topics into days.
 *
 * The selection rule is one line: on each day, take the topic with the highest
 * `priority × staleness`, where staleness grows with the number of days since
 * that topic was last scheduled. That gets weakness-weighting and spacing out
 * of the same expression — a weak topic comes back every second or third day,
 * a strong one drifts to the back of the queue — without a separate repetition
 * table, and without the previous implementation's failure mode, where sorting
 * an expanded pool by priority clumped every copy of a topic together and left
 * the day underfilled once they were all skipped as duplicates.
 */
export function schedule(params: ScheduleParams): ScheduledTask[] {
  const {
    candidates,
    startDay,
    horizonDays,
    dailyMinutes,
    dayOffset,
    daysUntilExam,
    committedMinutes,
    startOrderIndex,
  } = params;

  if (candidates.length === 0 || horizonDays <= 0) return [];

  const tasks: ScheduledTask[] = [];
  /** Absolute day index each topic was last scheduled on, or null. */
  const lastSeen = new Map<string, number>();
  /** How many times each topic has appeared, which drives what it asks for next. */
  const occurrences = new Map<string, number>();

  for (let day = 0; day < horizonDays; day += 1) {
    const date = addDays(startDay, day);
    const dayKey = date.toISOString();
    const absoluteDay = day + dayOffset;

    let remaining = dailyMinutes - (committedMinutes?.get(dayKey) ?? 0);
    let orderIndex = startOrderIndex?.get(dayKey) ?? 0;
    const usedToday = new Set<string>();

    // The last few days before the exam are for consolidation. Nothing new
    // lands there, and the checkpoint tests stop.
    const inRunIn =
      daysUntilExam !== null &&
      daysUntilExam - day >= 0 &&
      daysUntilExam - day < REVISION_RUN_IN_DAYS;

    // A weekly checkpoint keeps proficiency data fresh enough to re-prioritise on.
    if (!inRunIn && absoluteDay > 0 && absoluteDay % TEST_EVERY === 0 && remaining >= MIN_BLOCK_MINUTES) {
      const minutes = Math.min(MINUTES_BY_KIND.test, remaining);
      tasks.push({
        topicId: null,
        title: "Checkpoint test",
        kind: StudyTaskKind.test,
        minutes,
        scheduledFor: date,
        orderIndex: orderIndex++,
        priority: 100,
      });
      remaining -= minutes;
    }

    while (remaining >= MIN_BLOCK_MINUTES) {
      const candidate = pickForDay(candidates, usedToday, lastSeen, day);
      // Every topic is already on today's list and the budget still isn't
      // spent — stop rather than scheduling the same topic twice in a day.
      if (!candidate) break;

      usedToday.add(candidate.topicId);
      lastSeen.set(candidate.topicId, day);

      const occurrence = occurrences.get(candidate.topicId) ?? 0;
      occurrences.set(candidate.topicId, occurrence + 1);

      const kind = inRunIn
        ? StudyTaskKind.revise
        : kindFor(candidate.status, occurrence);
      const minutes = Math.min(MINUTES_BY_KIND[kind], remaining);

      tasks.push({
        topicId: candidate.topicId,
        title: candidate.title,
        kind,
        minutes,
        scheduledFor: date,
        orderIndex: orderIndex++,
        priority: candidate.priority,
      });
      remaining -= minutes;
    }
  }

  return tasks;
}

function kindFor(status: TopicStatus, occurrence: number): StudyTaskKind {
  const progression = KIND_PROGRESSION[status];
  return occurrence < progression.length
    ? progression[occurrence]
    : // After the progression runs out, alternate drilling and reviewing so a
      // topic that keeps coming back doesn't become the same block forever.
      occurrence % 2 === 0
      ? StudyTaskKind.revise
      : StudyTaskKind.practice;
}

/**
 * The topic most worth this slot.
 *
 * Two rules, in order:
 *
 *   1. **Cover the syllabus first.** Any topic not yet scheduled outranks every
 *      topic that has been, ordered among themselves by priority. Without this
 *      the plan starves its own tail: a purely multiplicative weakness score
 *      means a topic at 90% proficiency scores a seventeenth of one at 20%, and
 *      no amount of waiting lets it through — a fortnight's plan for a
 *      five-topic syllabus covered three of them and never mentioned the other
 *      two. You cannot revise what was never scheduled.
 *
 *   2. **Then weakness, weighted by neglect.** Once everything has been seen
 *      once, score is `priority × days since last scheduled`, which brings a
 *      weak topic back every other day and a strong one round about weekly,
 *      without a separate repetition table.
 */
function pickForDay(
  candidates: Candidate[],
  usedToday: Set<string>,
  lastSeen: Map<string, number>,
  day: number
): Candidate | null {
  let bestUnseen: Candidate | null = null;
  let bestSeen: Candidate | null = null;
  let bestSeenScore = -Infinity;

  for (const candidate of candidates) {
    if (usedToday.has(candidate.topicId)) continue;

    const seen = lastSeen.get(candidate.topicId);
    if (seen === undefined) {
      // `candidates` arrives priority-ordered, so the first unseen one wins.
      if (!bestUnseen) bestUnseen = candidate;
      continue;
    }

    // +1 so a topic scheduled today still scores above zero tomorrow.
    const score = candidate.priority * (day - seen + 1);
    if (score > bestSeenScore) {
      bestSeenScore = score;
      bestSeen = candidate;
    }
  }

  return bestUnseen ?? bestSeen;
}

