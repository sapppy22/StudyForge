"use server";

import { prisma } from "@/db/prisma";
import { AttemptStatus, QuestionType, TestStatus } from "@prisma/client";

export interface AnswerInput {
  questionId: string;
  response: string;
}

export async function startTestAttempt(testId: string, userId: string) {
  return prisma.testAttempt.create({
    data: {
      testId,
      userId,
      status: AttemptStatus.started,
    },
  });
}

export async function submitTestAnswers(
  testId: string,
  userId: string,
  answers: AnswerInput[]
) {
  const test = await prisma.test.findFirst({
    where: { id: testId, userId },
    include: {
      questions: { include: { question: true } },
    },
  });
  if (!test) throw new Error("Test not found");

  const attempt = await prisma.testAttempt.create({
    data: {
      testId,
      userId,
      status: AttemptStatus.submitted,
      submittedAt: new Date(),
    },
  });

  let totalScore = 0;
  let maxScore = 0;

  for (const a of answers) {
    const tq = test.questions.find((q) => q.questionId === a.questionId);
    if (!tq) continue;

    const question = tq.question;
    let isCorrect: boolean | null = null;
    let score = 0;
    let feedback = "";
    const max = 10;

    if (
      question.type === QuestionType.mcq ||
      question.type === QuestionType.msq ||
      question.type === QuestionType.numeric
    ) {
      isCorrect = a.response.trim().toLowerCase() === question.correctAnswer?.toLowerCase();
      score = isCorrect ? max : 0;
    } else {
      // Subjective: placeholder grading; real implementation calls LLM
      score = Math.floor(max * 0.7);
      feedback = "This is an automated placeholder grade. Real rubric-based grading will run via Claude.";
      isCorrect = null;
    }

    totalScore += score;
    maxScore += max;

    await prisma.answer.create({
      data: {
        attemptId: attempt.id,
        questionId: question.id,
        response: a.response,
        isCorrect,
        score,
        maxScore: max,
        feedback,
        gradedAt: new Date(),
      },
    });
  }

  await prisma.testAttempt.update({
    where: { id: attempt.id },
    data: {
      score: totalScore,
      maxScore,
      status: AttemptStatus.graded,
    },
  });

  await prisma.test.update({
    where: { id: testId },
    data: { status: TestStatus.completed, completedAt: new Date() },
  });

  return { attemptId: attempt.id, score: totalScore, maxScore };
}

export async function getAttemptResults(attemptId: string, userId: string) {
  return prisma.testAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      test: true,
      answers: { include: { question: true } },
    },
  });
}

export async function getTestHistory(userId: string) {
  return prisma.testAttempt.findMany({
    where: { userId },
    include: { test: true },
    orderBy: { createdAt: "desc" },
  });
}
