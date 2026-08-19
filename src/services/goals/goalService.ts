import { randomUUID } from "node:crypto";
import { prisma } from "@/db/prisma";
import { ExamType, TopicStatus } from "@prisma/client";
import { getTemplate } from "@/lib/templates";

export interface CreateGoalInput {
  userId: string;
  title: string;
  examType: ExamType;
  examDate?: string;
  dailyStudyMinutes?: number;
}

/**
 * Creates a goal and, when the exam has a syllabus template, its whole topic
 * tree.
 *
 * The tree used to be written one `create` per node — 61 sequential round trips
 * for the JEE template, 33 for Class 9 — and left a goal attached to a
 * half-built tree whenever one of them failed. Ids are generated up front
 * instead, so the rows can go in as a single bulk insert inside one transaction
 * with the goal itself: either the whole syllabus lands or none of it does.
 */
export async function createGoal(input: CreateGoalInput) {
  const goalId = randomUUID();
  const template = getTemplate(input.examType);

  // Flattened depth-first, parents before children, so that the shared
  // `orderIndex` counter keeps exactly the values the nested loops produced and
  // every row's `parentId` refers to a row earlier in the same insert.
  const nodes: {
    id: string;
    parentId: string | null;
    title: string;
    orderIndex: number;
  }[] = [];
  let orderIndex = 0;

  for (const subject of template?.subjects ?? []) {
    const subjectId = randomUUID();
    nodes.push({
      id: subjectId,
      parentId: null,
      title: subject.title,
      orderIndex: orderIndex++,
    });

    for (const chapter of subject.chapters ?? []) {
      const chapterId = randomUUID();
      nodes.push({
        id: chapterId,
        parentId: subjectId,
        title: chapter.title,
        orderIndex: orderIndex++,
      });

      for (const topic of chapter.topics ?? []) {
        nodes.push({
          id: randomUUID(),
          parentId: chapterId,
          title: topic,
          orderIndex: orderIndex++,
        });
      }
    }
  }

  // The array form of $transaction is deliberate: it issues the batch without
  // holding an interactive transaction open across round trips, which is what
  // the Supavisor pooler expects. `createMany` with no rows is a no-op, so an
  // exam without a template needs no special case.
  const [goal] = await prisma.$transaction([
    prisma.goal.create({
      data: {
        id: goalId,
        userId: input.userId,
        title: input.title,
        examType: input.examType,
        examDate: input.examDate ? new Date(input.examDate) : null,
        dailyStudyMinutes: input.dailyStudyMinutes ?? null,
      },
    }),
    prisma.syllabusTopic.createMany({
      data: nodes.map((node) => ({
        id: node.id,
        goalId,
        parentId: node.parentId,
        title: node.title,
        orderIndex: node.orderIndex,
        status: TopicStatus.not_started,
      })),
    }),
  ]);

  return goal;
}

export async function getGoalsByUser(userId: string) {
  return prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      topics: {
        where: { parentId: null },
        include: {
          children: {
            include: {
              children: true,
              proficiencyScores: { where: { userId } },
            },
          },
          proficiencyScores: { where: { userId } },
        },
      },
    },
  });
}

export async function getGoalById(goalId: string, userId: string) {
  return prisma.goal.findFirst({
    where: { id: goalId, userId },
    include: {
      topics: {
        where: { parentId: null },
        include: {
          children: {
            include: {
              children: true,
              proficiencyScores: { where: { userId } },
            },
          },
          proficiencyScores: { where: { userId } },
        },
      },
    },
  });
}

export async function getTopicById(topicId: string, userId: string) {
  return prisma.syllabusTopic.findFirst({
    where: { id: topicId, goal: { userId } },
    include: {
      goal: true,
      parent: true,
      children: true,
      proficiencyScores: { where: { userId } },
    },
  });
}


