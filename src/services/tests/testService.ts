import { prisma } from "@/db/prisma";
import { AttemptStatus, QuestionType, TestStatus } from "@prisma/client";
import { gradeSubjective } from "@/services/ai/grading";
import { recomputeTopicProficiency } from "@/services/analytics/proficiencyService";

export interface AnswerInput {
  questionId: string;
  response: string;
}

const MAX_PER_QUESTION = 10;
const OBJECTIVE_TYPES: QuestionType[] = [
  QuestionType.mcq,
  QuestionType.msq,
  QuestionType.numeric,
];

export async function startTestAttempt(testId: string, userId: string) {
  return prisma.testAttempt.create({
    data: { testId, userId, status: AttemptStatus.started },
  });
}

export async function submitTestAnswers(
  testId: string,
  userId: string,
  answers: AnswerInput[]
) {
  const test = await prisma.test.findFirst({
    where: { id: testId, userId },
    include: { questions: { include: { question: true } } },
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
  const topicIds = new Set<string>();

  for (const tq of test.questions) {
    const question = tq.question;
    topicIds.add(question.topicId);

    const provided = answers.find((a) => a.questionId === question.id);
    const response = provided?.response?.trim() ?? "";

    let isCorrect: boolean | null = null;
    let score = 0;
    let feedback = "";

    if (OBJECTIVE_TYPES.includes(question.type)) {
      const expected = (question.correctAnswer ?? "").trim().toLowerCase();
      isCorrect = response.length > 0 && response.toLowerCase() === expected;
      score = isCorrect ? MAX_PER_QUESTION : 0;
      feedback = isCorrect
        ? "Correct."
        : `Incorrect. The correct answer is ${question.correctAnswer ?? "—"}.`;
    } else {
      const graded = await gradeSubjective({
        question: question.content,
        rubric: question.rubric as { criteria: string[] } | null,
        modelAnswer: question.explanation,
        response,
        maxScore: MAX_PER_QUESTION,
      });
      score = graded.score;
      isCorrect = graded.isCorrect;
      feedback = graded.feedback;
    }

    totalScore += score;
    maxScore += MAX_PER_QUESTION;

    await prisma.answer.create({
      data: {
        attemptId: attempt.id,
        questionId: question.id,
        response,
        isCorrect,
        score,
        maxScore: MAX_PER_QUESTION,
        feedback,
        gradedAt: new Date(),
      },
    });
  }

  await prisma.testAttempt.update({
    where: { id: attempt.id },
    data: { score: totalScore, maxScore, status: AttemptStatus.graded },
  });

  await prisma.test.update({
    where: { id: testId },
    data: { status: TestStatus.completed, completedAt: new Date() },
  });

  // Recompute proficiency for every topic covered by this test.
  await Promise.all(
    Array.from(topicIds).map((topicId) =>
      recomputeTopicProficiency(userId, topicId)
    )
  );

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
    where: { userId, status: AttemptStatus.graded },
    include: { test: true },
    orderBy: { createdAt: "desc" },
  });
}
