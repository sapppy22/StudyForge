"use server";

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

export async function createGoal(input: CreateGoalInput) {
  const goal = await prisma.goal.create({
    data: {
      userId: input.userId,
      title: input.title,
      examType: input.examType,
      examDate: input.examDate ? new Date(input.examDate) : null,
      dailyStudyMinutes: input.dailyStudyMinutes ?? null,
    },
  });

  const template = getTemplate(input.examType);
  if (template) {
    let orderIndex = 0;

    for (const subject of template.subjects) {
      const subjectNode = await prisma.syllabusTopic.create({
        data: {
          goalId: goal.id,
          title: subject.title,
          orderIndex: orderIndex++,
          status: TopicStatus.not_started,
        },
      });

      for (const chapter of subject.chapters ?? []) {
        const chapterNode = await prisma.syllabusTopic.create({
          data: {
            goalId: goal.id,
            parentId: subjectNode.id,
            title: chapter.title,
            orderIndex: orderIndex++,
            status: TopicStatus.not_started,
          },
        });

        for (const topic of chapter.topics ?? []) {
          await prisma.syllabusTopic.create({
            data: {
              goalId: goal.id,
              parentId: chapterNode.id,
              title: topic,
              orderIndex: orderIndex++,
              status: TopicStatus.not_started,
            },
          });
        }
      }
    }
  }

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


