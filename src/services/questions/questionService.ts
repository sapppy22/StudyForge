import { prisma } from "@/db/prisma";
import {
  Difficulty,
  Prisma,
  QuestionSource,
  QuestionType,
  TestType,
  TestStatus,
} from "@prisma/client";
import { getTopicById } from "@/services/goals/goalService";
import { retrieveNotes } from "@/services/ai/retrieval";
import { generateQuestions } from "@/services/ai/questions";
import { getWeakestTopics } from "@/services/analytics/proficiencyService";

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

  const subjectPath = [topic.parent?.title, topic.goal?.title]
    .filter(Boolean)
    .join(" · ");
  const notes = await retrieveNotes(input.topicId, input.userId, topic.title, 5);

  const generated = await generateQuestions({
    topicTitle: topic.title,
    subjectPath: subjectPath || undefined,
    notes,
    objective: input.questionMix.objective,
    subjective: input.questionMix.subjective,
    difficulty: input.difficulty ?? "adaptive",
    reason: input.reason,
  });

  const questions = [];
  for (const g of generated) {
    questions.push(
      await prisma.question.create({
        data: {
          topicId: input.topicId,
          goalId: input.goalId,
          userId: input.userId,
          type: g.type === "mcq" ? QuestionType.mcq : QuestionType.short_answer,
          difficulty: g.difficulty as Difficulty,
          content: g.content,
          options: (g.options as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          correctAnswer: g.correctAnswer ?? null,
          rubric: (g.rubric as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          explanation: g.explanation ?? null,
          source: g.grounded
            ? QuestionSource.user_notes_grounded
            : QuestionSource.llm_generated,
        },
      })
    );
  }

  return questions;
}

export async function createTestFromQuestions(
  userId: string,
  goalId: string,
  topicIds: string[],
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
      settings: { topicIds },
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

/**
 * Weakness-weighted adaptive test: generates questions across the user's
 * lowest-proficiency topics (falling back to the first few topics of the goal
 * when no proficiency data exists yet).
 */
export async function createAdaptiveTest(
  userId: string,
  goalId: string,
  title = "Adaptive revision test"
) {
  const weakest = await getWeakestTopics(userId, goalId, 3);
  let topicIds = weakest.map((w) => w.topicId);

  if (topicIds.length === 0) {
    const leafTopics = await prisma.syllabusTopic.findMany({
      where: { goalId, children: { none: {} } },
      orderBy: { orderIndex: "asc" },
      take: 3,
      select: { id: true },
    });
    topicIds = leafTopics.map((t) => t.id);
  }

  if (topicIds.length === 0) throw new Error("No topics available for this goal");

  const questionIds: string[] = [];
  for (const topicId of topicIds) {
    const qs = await generateQuestionsForTopic({
      topicId,
      userId,
      goalId,
      questionMix: { objective: 2, subjective: 1 },
      difficulty: "adaptive",
      reason: "weakness-weighted revision",
    });
    questionIds.push(...qs.map((q) => q.id));
  }

  return createTestFromQuestions(
    userId,
    goalId,
    topicIds,
    questionIds,
    title,
    TestType.mock_test
  );
}

export async function getTestById(testId: string, userId: string) {
  return prisma.test.findFirst({
    where: { id: testId, userId },
    include: {
      questions: {
        include: { question: true },
        orderBy: { orderIndex: "asc" },
      },
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
