import { prisma } from "@/db/prisma";
import { AttemptStatus, QuestionType, TestStatus } from "@prisma/client";
import { gradeSubjective } from "@/services/ai/grading";
import { recomputeTopicProficiency } from "@/services/analytics/proficiencyService";
import { refreshPlanFromPerformance } from "@/services/plans/studyPlanService";
import { sendPerformanceReportForAttempt } from "@/services/email/emailService";
import { NotFoundError } from "@/lib/errors";

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
  if (!test) throw new NotFoundError("Test not found");

  const attempt = await prisma.testAttempt.create({
    data: {
      testId,
      userId,
      status: AttemptStatus.submitted,
      submittedAt: new Date(),
    },
  });

  // Grade every question concurrently. Subjective answers each cost a model
  // call, so grading them in sequence made submission take as long as the sum
  // of those calls — a five-question written test sat there for half a minute.
  // The generation route bounds a test at 30 questions, which keeps the fan-out
  // reasonable.
  const graded = await Promise.all(
    test.questions.map(async (tq) => {
      const question = tq.question;
      const response =
        answers.find((a) => a.questionId === question.id)?.response?.trim() ?? "";

      if (OBJECTIVE_TYPES.includes(question.type)) {
        const expected = (question.correctAnswer ?? "").trim().toLowerCase();
        const isCorrect =
          response.length > 0 && response.toLowerCase() === expected;
        return {
          question,
          response,
          isCorrect,
          score: isCorrect ? MAX_PER_QUESTION : 0,
          feedback: isCorrect
            ? "Correct."
            : `Incorrect. The correct answer is ${question.correctAnswer ?? "—"}.`,
        };
      }

      const result = await gradeSubjective({
        question: question.content,
        rubric: question.rubric as { criteria: string[] } | null,
        modelAnswer: question.explanation,
        response,
        maxScore: MAX_PER_QUESTION,
      });

      return {
        question,
        response,
        isCorrect: result.isCorrect,
        score: result.score,
        feedback: result.feedback,
      };
    })
  );

  const totalScore = graded.reduce((sum, row) => sum + row.score, 0);
  const maxScore = graded.length * MAX_PER_QUESTION;
  const topicIds = new Set(graded.map((row) => row.question.topicId));
  const gradedAt = new Date();

  // One insert rather than one per question.
  await prisma.answer.createMany({
    data: graded.map((row) => ({
      attemptId: attempt.id,
      questionId: row.question.id,
      response: row.response,
      isCorrect: row.isCorrect,
      score: row.score,
      maxScore: MAX_PER_QUESTION,
      feedback: row.feedback,
      gradedAt,
    })),
  });

  await prisma.$transaction([
    prisma.testAttempt.update({
      where: { id: attempt.id },
      data: { score: totalScore, maxScore, status: AttemptStatus.graded },
    }),
    prisma.test.update({
      where: { id: testId },
      data: { status: TestStatus.completed, completedAt: gradedAt },
    }),
  ]);

  // Recompute proficiency for every topic covered by this test.
  await Promise.all(
    Array.from(topicIds).map((topicId) =>
      recomputeTopicProficiency(userId, topicId)
    )
  );

  // Proficiency just moved, so the study plan's priorities are stale. Rewrite
  // the future days from the new numbers — this is what makes the plan adaptive
  // rather than a one-off schedule.
  await refreshPlanFromPerformance(userId, test.goalId).catch(() => {
    // A planning failure must not fail the submission the student just made.
  });

  // Automatically send / log performance email report
  sendPerformanceReportForAttempt(attempt.id, userId).catch((err) => {
    console.warn("[TestService] Performance email dispatch skipped:", err);
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

/**
 * The tests list: every test the user owns with its question count and most
 * recent graded attempt. Lived inline in the route handler, which was the only
 * place outside this layer reaching into Prisma directly.
 */
export async function listTests(userId: string) {
  return prisma.test.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { questions: true } },
      attempts: {
        where: { status: AttemptStatus.graded },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, score: true, maxScore: true, createdAt: true },
      },
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
