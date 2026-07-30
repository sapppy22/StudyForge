"use server";

import { prisma } from "@/db/prisma";
import {
  Difficulty,
  QuestionSource,
  QuestionType,
  TestType,
  TestStatus,
} from "@prisma/client";
import { getTopicById } from "@/services/goals/goalService";

export interface GenerateQuestionsInput {
  topicId: string;
  userId: string;
  goalId: string;
  questionMix: { objective: number; subjective: number };
  difficulty?: Difficulty | "adaptive";
  reason?: string;
}

export async function generateQuestionsForTopic(input: GenerateQuestionsInput) {
  const topic = await getTopicById(input.topicId, input.userId);
  if (!topic) throw new Error("Topic not found");

  const objectiveCount = input.questionMix.objective;
  const subjectiveCount = input.questionMix.subjective;
  const questions = [];

  for (let i = 0; i < objectiveCount; i++) {
    questions.push(
      await prisma.question.create({
        data: {
          topicId: input.topicId,
          goalId: input.goalId,
          userId: input.userId,
          type: QuestionType.mcq,
          difficulty: Difficulty.medium,
          content: `Sample objective question ${i + 1} for ${topic.title}`,
          options: [
            { label: "A", text: "Option A" },
            { label: "B", text: "Option B" },
            { label: "C", text: "Option C" },
            { label: "D", text: "Option D" },
          ],
          correctAnswer: "A",
          explanation: `This is a placeholder explanation for ${topic.title}.`,
          source: QuestionSource.llm_generated,
        },
      })
    );
  }

  for (let i = 0; i < subjectiveCount; i++) {
    questions.push(
      await prisma.question.create({
        data: {
          topicId: input.topicId,
          goalId: input.goalId,
          userId: input.userId,
          type: QuestionType.short_answer,
          difficulty: Difficulty.medium,
          content: `Sample subjective question ${i + 1} for ${topic.title}`,
          rubric: { criteria: ["Conceptual accuracy", "Completeness"] },
          explanation: `Sample rubric and explanation for ${topic.title}.`,
          source: QuestionSource.llm_generated,
        },
      })
    );
  }

  return questions;
}

export async function createTestFromQuestions(
  userId: string,
  goalId: string,
  topicId: string,
  questionIds: string[],
  title: string,
  type: TestType = TestType.topic_test
) {
  const test = await prisma.test.create({
    data: {
      userId,
      goalId,
      title,
      type,
      status: TestStatus.ready,
      settings: { topicId },
    },
  });

  await prisma.testQuestion.createMany({
    data: questionIds.map((questionId, index) => ({
      testId: test.id,
      questionId,
      orderIndex: index,
    })),
  });

  return prisma.test.findUnique({
    where: { id: test.id },
    include: { questions: { include: { question: true } } },
  });
}

export async function getTestById(testId: string, userId: string) {
  return prisma.test.findFirst({
    where: { id: testId, userId },
    include: {
      questions: { include: { question: true }, orderBy: { orderIndex: "asc" } },
      attempts: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function getQuestionsByTopic(topicId: string, userId: string) {
  return prisma.question.findMany({
    where: { topicId, userId },
    orderBy: { createdAt: "desc" },
  });
}
