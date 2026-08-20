import { randomUUID } from "node:crypto";
import { prisma } from "@/db/prisma";
import {
  Difficulty,
  ExamType,
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
import { examEntry } from "@/data/exams/catalog";
import { InvalidStateError, NotFoundError } from "@/lib/errors";

export interface QuestionMix {
  /** Multiple choice. */
  objective: number;
  /** Numerical-answer questions — the ones you have to work out. */
  numeric?: number;
  /** Written answers, graded against a rubric. */
  subjective: number;
  /** Previous-year questions pulled from the shared bank for this exam. */
  pyq?: number;
}

export interface GenerateQuestionsInput {
  topicId: string;
  userId: string;
  goalId: string;
  questionMix: QuestionMix;
  difficulty?: Difficulty | "adaptive";
  reason?: string;
}

const AI_TYPE_MAP: Record<string, QuestionType> = {
  mcq: QuestionType.mcq,
  numeric: QuestionType.numeric,
  short_answer: QuestionType.short_answer,
};

/**
 * Previous-year questions for this topic, from the shared bank.
 *
 * A quiz built purely from a student's own notes can only ever test what they
 * already thought to write down. Real past-paper questions are the corrective:
 * they come from the exam, not from the notes, and they are what the student
 * will actually face.
 *
 * Matched on the topic's own words against the bank's chapter, topic and tag
 * columns, then widened to the subject, then to the exam — better a relevant
 * past paper from the same subject than none at all.
 */
async function pickBankQuestions(params: {
  examType: ExamType;
  topicTitle: string;
  subjectTitle?: string;
  difficulty?: Difficulty;
  count: number;
  excludeContent: Set<string>;
}) {
  if (params.count <= 0) return [];

  const terms = params.topicTitle
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 3)
    .slice(0, 6);

  const difficultyFilter = params.difficulty ? { difficulty: params.difficulty } : {};

  const tiers: Prisma.BankQuestionWhereInput[] = [];
  if (terms.length > 0) {
    tiers.push({
      examType: params.examType,
      ...difficultyFilter,
      OR: terms.flatMap((term) => [
        { chapter: { contains: term, mode: "insensitive" as const } },
        { topic: { contains: term, mode: "insensitive" as const } },
        { content: { contains: term, mode: "insensitive" as const } },
        { tags: { has: term.toLowerCase() } },
      ]),
    });
  }
  if (params.subjectTitle) {
    tiers.push({
      examType: params.examType,
      subject: { contains: params.subjectTitle, mode: "insensitive" },
    });
  }
  tiers.push({ examType: params.examType });

  const picked: Awaited<ReturnType<typeof prisma.bankQuestion.findMany>> = [];
  const seen = new Set<string>();

  for (const where of tiers) {
    if (picked.length >= params.count) break;
    const rows = await prisma.bankQuestion.findMany({
      where: { ...where, correctAnswer: { not: null } },
      orderBy: [{ year: "desc" }, { orderIndex: "asc" }],
      take: params.count * 3,
    });
    for (const row of rows) {
      if (picked.length >= params.count) break;
      if (seen.has(row.id) || params.excludeContent.has(row.content)) continue;
      seen.add(row.id);
      picked.push(row);
    }
  }

  return picked.slice(0, params.count);
}

export async function generateQuestionsForTopic(input: GenerateQuestionsInput) {
  const topic = await getTopicById(input.topicId, input.userId);
  if (!topic) throw new NotFoundError("Topic not found");

  const subjectPath = [topic.parent?.title, topic.goal?.title]
    .filter(Boolean)
    .join(" · ");
  const examType = topic.goal?.examType ?? ExamType.CUSTOM;
  const notes = await retrieveNotes(input.topicId, input.userId, topic.title, 5);

  const mix = input.questionMix;
  const difficulty = input.difficulty ?? "adaptive";

  const [generated, bankRows] = await Promise.all([
    generateQuestions({
      topicTitle: topic.title,
      subjectPath: subjectPath || undefined,
      notes,
      objective: mix.objective,
      numeric: mix.numeric ?? 0,
      subjective: mix.subjective,
      difficulty,
      reason: input.reason,
      examName: examEntry(examType)?.fullName,
    }),
    pickBankQuestions({
      examType,
      topicTitle: topic.title,
      subjectTitle: topic.parent?.title,
      difficulty: difficulty === "adaptive" ? undefined : difficulty,
      count: mix.pyq ?? 0,
      excludeContent: new Set(),
    }),
  ]);

  const rows: Prisma.QuestionCreateManyInput[] = [
    // Past papers lead the quiz: they set the standard the generated questions
    // are then pitched against.
    ...bankRows.map((row) => ({
      topicId: input.topicId,
      goalId: input.goalId,
      userId: input.userId,
      type: row.type,
      difficulty: row.difficulty,
      content: row.content,
      options: (row.options as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      correctAnswer: row.correctAnswer,
      rubric: Prisma.JsonNull,
      explanation: row.solution,
      source: QuestionSource.web_sourced_pyq,
      metadata: {
        bankSlug: row.slug,
        chapter: row.chapter,
        year: row.year,
        sourceName: row.sourceName,
        sourceUrl: row.sourceUrl,
      } as Prisma.InputJsonValue,
    })),
    ...generated.map((g) => ({
      topicId: input.topicId,
      goalId: input.goalId,
      userId: input.userId,
      type: AI_TYPE_MAP[g.type] ?? QuestionType.short_answer,
      difficulty: g.difficulty as Difficulty,
      content: g.content,
      options: (g.options as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      correctAnswer: g.correctAnswer ?? null,
      rubric: (g.rubric as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      explanation: g.explanation ?? null,
      source: g.grounded
        ? QuestionSource.user_notes_grounded
        : QuestionSource.llm_generated,
    })),
  ];

  if (rows.length === 0) return [];

  // One insert rather than one round trip per question — a 12-question quiz was
  // twelve sequential writes.
  const ids = rows.map(() => randomUUID());
  await prisma.question.createMany({
    data: rows.map((row, index) => ({ ...row, id: ids[index] })),
  });

  const created = await prisma.question.findMany({ where: { id: { in: ids } } });
  // Preserve the composed order rather than whatever the database returns.
  const byId = new Map(created.map((q) => [q.id, q]));
  return ids.map((id) => byId.get(id)).filter((q): q is (typeof created)[number] => Boolean(q));
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

  if (topicIds.length === 0) throw new InvalidStateError("No topics available for this goal");

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
