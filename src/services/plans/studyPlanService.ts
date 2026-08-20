import { prisma } from "@/db/prisma";
import { StudyPlanStatus, type Prisma } from "@prisma/client";
import {
  generatePlanNarrative,
  type PlanTopicSummary,
} from "@/services/ai/studyplan";
import {
  addDays,
  daysBetween,
  DEFAULT_DAILY_MINUTES,
  DEFAULT_HORIZON_DAYS,
  MAX_HORIZON_DAYS,
  MIN_BLOCK_MINUTES,
  priorityFor,
  resolveHorizon,
  schedule,
  startOfUtcDay,
  type Candidate,
} from "./scheduler";
import { InvalidStateError, NotFoundError } from "@/lib/errors";

export { startOfUtcDay } from "./scheduler";
export type { ScheduledTask } from "./scheduler";

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

/* -------------------------------------------------------------------------- */
/*  Candidates                                                                 */
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
      return {
        topicId: topic.id,
        title: topic.title,
        status: topic.status,
        proficiency: score,
        priority: priorityFor({
          proficiency: score,
          status: topic.status,
          weight: topic.weight,
        }),
        orderIndex: topic.orderIndex,
      };
    })
    // Ties broken by syllabus order so two runs of the same data produce the
    // same plan — a schedule that reshuffles on every rebuild can't be trusted.
    .sort((a, b) => b.priority - a.priority || a.orderIndex - b.orderIndex);
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
  const dailyMinutes = Math.max(
    MIN_BLOCK_MINUTES,
    goal.dailyStudyMinutes ?? DEFAULT_DAILY_MINUTES
  );
  const daysUntilExam = goal.examDate
    ? daysBetween(today, startOfUtcDay(goal.examDate))
    : null;

  const horizonDays = resolveHorizon(input.horizonDays, daysUntilExam);

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
    daysUntilExam,
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

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: { examDate: true },
  });
  const daysUntilExam = goal?.examDate
    ? daysBetween(today, startOfUtcDay(goal.examDate))
    : null;

  // Completed work stays; only unfinished future blocks are reshuffled. Past
  // incomplete blocks are dropped rather than carried forward — a plan that
  // accumulates a guilt backlog stops being followed.
  await prisma.studyPlanTask.deleteMany({
    where: { planId: plan.id, completed: false, scheduledFor: { gte: today } },
  });

  // Whatever the student already finished today is time they have spent. The
  // rewrite has to budget around it, or the day is silently double-booked and
  // every re-plan after a morning session hands them an unachievable evening.
  const survivors = await prisma.studyPlanTask.findMany({
    where: { planId: plan.id, scheduledFor: { gte: today } },
    select: { scheduledFor: true, minutes: true, orderIndex: true },
  });

  const committedMinutes = new Map<string, number>();
  const startOrderIndex = new Map<string, number>();
  for (const task of survivors) {
    const key = task.scheduledFor.toISOString();
    committedMinutes.set(key, (committedMinutes.get(key) ?? 0) + task.minutes);
    startOrderIndex.set(key, Math.max(startOrderIndex.get(key) ?? 0, task.orderIndex + 1));
  }

  const tasks = schedule({
    candidates,
    startDay: today,
    horizonDays: Math.min(remainingDays, MAX_HORIZON_DAYS),
    dailyMinutes: plan.dailyMinutes,
    // Preserve the original test cadence across the rewrite.
    dayOffset: daysBetween(startOfUtcDay(plan.startDate), today),
    daysUntilExam,
    committedMinutes,
    startOrderIndex,
  });

  if (tasks.length > 0) {
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
  }

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
