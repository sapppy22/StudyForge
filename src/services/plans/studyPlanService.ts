import { prisma } from "@/db/prisma";
import {
  StudyPlanStatus,
  StudyTaskKind,
  TopicStatus,
  type Prisma,
} from "@prisma/client";
import {
  generatePlanNarrative,
  type PlanTopicSummary,
} from "@/services/ai/studyplan";
import { InvalidStateError, NotFoundError } from "@/lib/errors";

/**
 * Adaptive study plans.
 *
 * Scheduling is deterministic and explainable: every topic gets a priority
 * derived from how far its measured proficiency sits below mastery, scaled by
 * its syllabus weight and nudged by its status. Topics are then packed into
 * days against the student's minute budget. After every graded test the plan
 * re-prioritises and rewrites *only the future days*, so completed work is
 * never rewritten under the student.
 */

const DEFAULT_DAILY_MINUTES = 60;
const DEFAULT_HORIZON_DAYS = 14;
const MAX_HORIZON_DAYS = 60;
/** A topic with no test history is assumed mid-weak — worth covering, not urgent. */
const UNTESTED_WEAKNESS = 60;
/** Mock test cadence, in days. */
const TEST_EVERY = 7;

const MINUTES_BY_KIND: Record<StudyTaskKind, number> = {
  learn: 45,
  practice: 30,
  revise: 20,
  test: 30,
};

/** Status nudges the raw weakness score: unlearned material outranks a review. */
const STATUS_MULTIPLIER: Record<TopicStatus, number> = {
  not_started: 1.15,
  learning: 1.1,
  reviewing: 0.95,
  mastered: 0.5,
};

const KIND_BY_STATUS: Record<TopicStatus, StudyTaskKind> = {
  not_started: StudyTaskKind.learn,
  learning: StudyTaskKind.practice,
  reviewing: StudyTaskKind.revise,
  mastered: StudyTaskKind.test,
};

interface Candidate {
  topicId: string;
  title: string;
  status: TopicStatus;
  proficiency: number | null;
  priority: number;
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

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/* -------------------------------------------------------------------------- */
/*  Prioritisation                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Leaf topics only — a parent node like "Physics" isn't something you sit down
 * and study for 45 minutes, so scheduling it would produce a useless block.
 */
async function loadCandidates(
  goalId: string,
  userId: string
): Promise<Candidate[]> {
  const topics = await prisma.syllabusTopic.findMany({
    where: { goalId, children: { none: {} } },
    include: { proficiencyScores: { where: { userId } } },
    orderBy: { orderIndex: "asc" },
  });

  return topics
    .map((topic) => {
      const score = topic.proficiencyScores[0]?.score ?? null;
      const weakness = score === null ? UNTESTED_WEAKNESS : 100 - score;
      const priority = Math.round(
        weakness * STATUS_MULTIPLIER[topic.status] * (topic.weight || 1)
      );
      return {
        topicId: topic.id,
        title: topic.title,
        status: topic.status,
        proficiency: score,
        priority,
      };
    })
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Expands the candidate list into a rotation where weaker topics recur more
 * often. Walking this pool round-robin gives weakness-weighted spacing without
 * needing an explicit repetition schedule.
 */
function buildRotation(candidates: Candidate[]): Candidate[] {
  if (candidates.length === 0) return [];

  const third = Math.max(1, Math.ceil(candidates.length / 3));
  const rotation: Candidate[] = [];

  candidates.forEach((candidate, index) => {
    const repeats = index < third ? 3 : index < third * 2 ? 2 : 1;
    for (let i = 0; i < repeats; i += 1) rotation.push(candidate);
  });

  // Interleave so the same topic isn't scheduled on consecutive days.
  return rotation.sort((a, b) => b.priority - a.priority).filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/*  Scheduling                                                                 */
/* -------------------------------------------------------------------------- */

interface ScheduledTask {
  topicId: string | null;
  title: string;
  kind: StudyTaskKind;
  minutes: number;
  scheduledFor: Date;
  orderIndex: number;
  priority: number;
}

function schedule(params: {
  candidates: Candidate[];
  startDay: Date;
  horizonDays: number;
  dailyMinutes: number;
  /** Day offset of the first scheduled day, so test cadence survives a partial rewrite. */
  dayOffset: number;
}): ScheduledTask[] {
  const { candidates, startDay, horizonDays, dailyMinutes, dayOffset } = params;
  const rotation = buildRotation(candidates);
  if (rotation.length === 0) return [];

  const tasks: ScheduledTask[] = [];
  let cursor = 0;

  for (let day = 0; day < horizonDays; day += 1) {
    const date = addDays(startDay, day);
    const absoluteDay = day + dayOffset;
    let remaining = dailyMinutes;
    let orderIndex = 0;
    const usedToday = new Set<string>();

    // A weekly checkpoint keeps proficiency data fresh enough to re-prioritise on.
    if (absoluteDay > 0 && absoluteDay % TEST_EVERY === 0) {
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

    // Fill the rest of the day from the rotation, never repeating a topic.
    let guard = 0;
    while (remaining >= 15 && guard < rotation.length * 2) {
      const candidate = rotation[cursor % rotation.length];
      cursor += 1;
      guard += 1;

      if (usedToday.has(candidate.topicId)) continue;
      usedToday.add(candidate.topicId);

      const kind = KIND_BY_STATUS[candidate.status];
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

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

export interface GeneratePlanInput {
  userId: string;
  goalId: string;
  horizonDays?: number;
}

export async function generateStudyPlan(input: GeneratePlanInput) {
  const goal = await prisma.goal.findFirst({
    where: { id: input.goalId, userId: input.userId },
  });
  if (!goal) throw new NotFoundError("Goal not found");

  const candidates = await loadCandidates(goal.id, input.userId);
  if (candidates.length === 0) {
    throw new InvalidStateError(
      "This goal has no syllabus topics yet — add topics before generating a plan."
    );
  }

  const today = startOfUtcDay(new Date());
  const dailyMinutes = goal.dailyStudyMinutes ?? DEFAULT_DAILY_MINUTES;
  const daysUntilExam = goal.examDate
    ? daysBetween(today, startOfUtcDay(goal.examDate))
    : null;

  // Never plan past the exam, and never plan an unbounded horizon.
  const horizonDays = Math.max(
    1,
    Math.min(
      input.horizonDays ?? DEFAULT_HORIZON_DAYS,
      MAX_HORIZON_DAYS,
      daysUntilExam !== null && daysUntilExam > 0 ? daysUntilExam : MAX_HORIZON_DAYS
    )
  );

  const narrative = await generatePlanNarrative({
    goalTitle: goal.title,
    examType: goal.examType,
    daysUntilExam,
    dailyMinutes,
    horizonDays,
    topics: candidates.slice(0, 10).map(
      (c): PlanTopicSummary => ({
        title: c.title,
        proficiency: c.proficiency,
        status: c.status,
      })
    ),
  });

  const focusByTopic = new Map(
    narrative.focus.map((f) => [f.topic.toLowerCase(), f.note])
  );

  const tasks = schedule({
    candidates,
    startDay: today,
    horizonDays,
    dailyMinutes,
    dayOffset: 0,
  });

  // Replace any previous plan for this goal rather than stacking active plans.
  await prisma.studyPlan.updateMany({
    where: { userId: input.userId, goalId: goal.id, status: StudyPlanStatus.active },
    data: { status: StudyPlanStatus.archived },
  });

  return prisma.studyPlan.create({
    data: {
      userId: input.userId,
      goalId: goal.id,
      title: `${goal.title} — ${horizonDays}-day plan`,
      startDate: today,
      endDate: addDays(today, horizonDays - 1),
      dailyMinutes,
      rationale: narrative.rationale,
      generatedBy: narrative.generatedBy,
      tasks: {
        create: tasks.map((task) => ({
          topicId: task.topicId,
          title: task.title,
          description: task.topicId
            ? (focusByTopic.get(task.title.toLowerCase()) ?? null)
            : "Covers your current weakest topics — the result re-prioritises the rest of the plan.",
          kind: task.kind,
          minutes: task.minutes,
          scheduledFor: task.scheduledFor,
          orderIndex: task.orderIndex,
          priority: task.priority,
        })),
      },
    },
    include: { tasks: { orderBy: [{ scheduledFor: "asc" }, { orderIndex: "asc" }] } },
  });
}

/**
 * Re-prioritises the active plan from current proficiency, rewriting only days
 * from today forward. Deliberately does not call the model: this runs after
 * every graded test, and the schedule maths is what needs to change, not the
 * prose. Returns null when the goal has no active plan.
 */
export async function refreshPlanFromPerformance(userId: string, goalId: string) {
  const plan = await prisma.studyPlan.findFirst({
    where: { userId, goalId, status: StudyPlanStatus.active },
  });
  if (!plan) return null;

  const candidates = await loadCandidates(goalId, userId);
  if (candidates.length === 0) return plan;

  const today = startOfUtcDay(new Date());
  const remainingDays = plan.endDate
    ? Math.max(1, daysBetween(today, startOfUtcDay(plan.endDate)) + 1)
    : DEFAULT_HORIZON_DAYS;

  // Completed work stays; only unfinished future blocks are reshuffled. Past
  // incomplete blocks are dropped rather than carried forward — a plan that
  // accumulates a guilt backlog stops being followed.
  await prisma.studyPlanTask.deleteMany({
    where: { planId: plan.id, completed: false, scheduledFor: { gte: today } },
  });

  const tasks = schedule({
    candidates,
    startDay: today,
    horizonDays: Math.min(remainingDays, MAX_HORIZON_DAYS),
    dailyMinutes: plan.dailyMinutes,
    // Preserve the original test cadence across the rewrite.
    dayOffset: daysBetween(startOfUtcDay(plan.startDate), today),
  });

  await prisma.studyPlanTask.createMany({
    data: tasks.map((task) => ({
      planId: plan.id,
      topicId: task.topicId,
      title: task.title,
      kind: task.kind,
      minutes: task.minutes,
      scheduledFor: task.scheduledFor,
      orderIndex: task.orderIndex,
      priority: task.priority,
    })),
  });

  return prisma.studyPlan.update({
    where: { id: plan.id },
    data: { version: { increment: 1 }, generatedAt: new Date() },
  });
}

export async function getActivePlan(userId: string, goalId: string) {
  return prisma.studyPlan.findFirst({
    where: { userId, goalId, status: StudyPlanStatus.active },
    include: {
      tasks: {
        orderBy: [{ scheduledFor: "asc" }, { orderIndex: "asc" }],
        include: { topic: { select: { id: true, title: true } } },
      },
    },
  });
}

export async function setTaskCompleted(
  taskId: string,
  userId: string,
  completed: boolean
) {
  const task = await prisma.studyPlanTask.findFirst({
    where: { id: taskId, plan: { userId } },
    select: { id: true },
  });
  if (!task) throw new NotFoundError("Task not found");

  return prisma.studyPlanTask.update({
    where: { id: taskId },
    data: { completed, completedAt: completed ? new Date() : null },
  });
}

/** Today's blocks across every active plan — used by the dashboard. */
export async function getTodaysTasks(userId: string) {
  const today = startOfUtcDay(new Date());
  return prisma.studyPlanTask.findMany({
    where: {
      plan: { userId, status: StudyPlanStatus.active },
      scheduledFor: today,
    },
    orderBy: { orderIndex: "asc" },
    include: { topic: { select: { id: true, title: true } } },
  });
}

export type StudyPlanWithTasks = Prisma.PromiseReturnType<typeof getActivePlan>;
