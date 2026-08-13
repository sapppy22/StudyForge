import { prisma } from "@/db/prisma";
import type { Difficulty, ExamType, Prisma } from "@prisma/client";
import { questionBank } from "@/data/question-bank";

/**
 * The shared, exam-wide practice sheet.
 *
 * Bank content is global reference data seeded from `src/data/question-bank`;
 * per-user tick-off state, timing and bookmarks live in `BankProgress`. Seeding
 * upserts on `slug`, so editing a seed file and re-running updates the row in
 * place rather than creating a duplicate.
 */

export type BankFilterStatus = "all" | "solved" | "unsolved" | "bookmarked";

export interface BankQuery {
  userId: string;
  examType: ExamType;
  subject?: string;
  chapter?: string;
  difficulty?: Difficulty;
  status?: BankFilterStatus;
  search?: string;
}

/** Idempotently upserts every curated question. Safe to run repeatedly. */
export async function seedQuestionBank() {
  let written = 0;

  for (const [index, seed] of questionBank.entries()) {
    const data = {
      examType: seed.examType,
      subject: seed.subject,
      chapter: seed.chapter,
      topic: seed.topic ?? null,
      type: seed.type,
      difficulty: seed.difficulty,
      content: seed.content,
      correctAnswer: seed.correctAnswer ?? null,
      solution: seed.solution ?? null,
      hint: seed.hint ?? null,
      marks: seed.marks ?? 4,
      expectedMinutes: seed.expectedMinutes ?? 3,
      year: seed.year ?? null,
      tags: seed.tags ?? [],
      orderIndex: index,
    };

    await prisma.bankQuestion.upsert({
      where: { slug: seed.slug },
      create: { slug: seed.slug, ...data },
      update: data,
    });
    written += 1;
  }

  return { written };
}

/**
 * Seeds on first use so a fresh database is never an empty sheet.
 *
 * Cached per process: the check is a cheap count, but the seed itself is ~90
 * upserts and must not run on every request. A cold serverless instance will
 * re-run the count once, which is fine.
 */
let seedPromise: Promise<void> | null = null;

export function ensureBankSeeded(): Promise<void> {
  seedPromise ??= (async () => {
    const count = await prisma.bankQuestion.count();
    if (count === 0) await seedQuestionBank();
  })().catch((error) => {
    // Don't cache a failure — the next request should retry.
    seedPromise = null;
    throw error;
  });

  return seedPromise;
}

export async function listBankQuestions(query: BankQuery) {
  await ensureBankSeeded();

  // Search and status are independent predicates. Composing them as separate
  // entries in an AND array keeps them conjoined — assigning both to a single
  // `where.OR` would silently turn "search AND unsolved" into "search OR
  // unsolved". The `unsolved` branch must also match questions the user has
  // never touched, which have no BankProgress row at all, hence the `none` arm.
  const and: Prisma.BankQuestionWhereInput[] = [{ examType: query.examType }];

  if (query.subject) and.push({ subject: query.subject });
  if (query.chapter) and.push({ chapter: query.chapter });
  if (query.difficulty) and.push({ difficulty: query.difficulty });

  if (query.search) {
    and.push({
      OR: [
        { content: { contains: query.search, mode: "insensitive" } },
        { chapter: { contains: query.search, mode: "insensitive" } },
        { topic: { contains: query.search, mode: "insensitive" } },
        { tags: { has: query.search.toLowerCase() } },
      ],
    });
  }

  if (query.status === "solved") {
    and.push({ progress: { some: { userId: query.userId, solved: true } } });
  } else if (query.status === "unsolved") {
    and.push({
      OR: [
        { progress: { none: { userId: query.userId } } },
        { progress: { some: { userId: query.userId, solved: false } } },
      ],
    });
  } else if (query.status === "bookmarked") {
    and.push({ progress: { some: { userId: query.userId, bookmarked: true } } });
  }

  return prisma.bankQuestion.findMany({
    where: { AND: and },
    orderBy: { orderIndex: "asc" },
    include: {
      progress: { where: { userId: query.userId } },
    },
  });
}

/** Distinct subjects and chapters for an exam, for the filter controls. */
export async function getBankTaxonomy(examType: ExamType) {
  await ensureBankSeeded();

  const rows = await prisma.bankQuestion.findMany({
    where: { examType },
    select: { subject: true, chapter: true, orderIndex: true },
    orderBy: { orderIndex: "asc" },
  });

  const subjects = new Map<string, string[]>();
  for (const row of rows) {
    const chapters = subjects.get(row.subject) ?? [];
    if (!chapters.includes(row.chapter)) chapters.push(row.chapter);
    subjects.set(row.subject, chapters);
  }

  return Array.from(subjects, ([subject, chapters]) => ({ subject, chapters }));
}

/** Sheet-level completion stats, overall and split by difficulty. */
export async function getBankStats(userId: string, examType: ExamType) {
  await ensureBankSeeded();

  const [questions, solvedRows] = await Promise.all([
    prisma.bankQuestion.findMany({
      where: { examType },
      select: { id: true, difficulty: true, subject: true },
    }),
    prisma.bankProgress.findMany({
      where: { userId, solved: true, question: { examType } },
      select: {
        questionId: true,
        timeSpentSec: true,
        bestTimeSec: true,
        question: { select: { difficulty: true, subject: true } },
      },
    }),
  ]);

  const solvedIds = new Set(solvedRows.map((r) => r.questionId));
  const byDifficulty = { easy: 0, medium: 0, hard: 0 };
  const totalByDifficulty = { easy: 0, medium: 0, hard: 0 };
  const bySubject = new Map<string, { total: number; solved: number }>();

  for (const q of questions) {
    totalByDifficulty[q.difficulty] += 1;
    const entry = bySubject.get(q.subject) ?? { total: 0, solved: 0 };
    entry.total += 1;
    if (solvedIds.has(q.id)) {
      byDifficulty[q.difficulty] += 1;
      entry.solved += 1;
    }
    bySubject.set(q.subject, entry);
  }

  const totalTimeSec = solvedRows.reduce((sum, r) => sum + r.timeSpentSec, 0);

  return {
    total: questions.length,
    solved: solvedIds.size,
    byDifficulty,
    totalByDifficulty,
    bySubject: Array.from(bySubject, ([subject, v]) => ({ subject, ...v })),
    totalTimeSec,
  };
}

/**
 * Ticks a question solved or unsolved.
 *
 * `elapsedSec` is the time on the clock for *this* attempt. It accumulates into
 * `timeSpentSec` and updates `bestTimeSec` only when the question is being
 * marked solved — timing an abandoned attempt would poison the personal best.
 */
export async function setSolved(
  userId: string,
  questionId: string,
  solved: boolean,
  elapsedSec = 0
) {
  const existing = await prisma.bankProgress.findUnique({
    where: { userId_questionId: { userId, questionId } },
  });

  const bestTimeSec =
    solved && elapsedSec > 0
      ? Math.min(existing?.bestTimeSec ?? Number.MAX_SAFE_INTEGER, elapsedSec)
      : (existing?.bestTimeSec ?? null);

  return prisma.bankProgress.upsert({
    where: { userId_questionId: { userId, questionId } },
    create: {
      userId,
      questionId,
      solved,
      attempts: solved ? 1 : 0,
      timeSpentSec: elapsedSec,
      bestTimeSec: solved && elapsedSec > 0 ? elapsedSec : null,
      solvedAt: solved ? new Date() : null,
    },
    update: {
      solved,
      attempts: { increment: solved ? 1 : 0 },
      timeSpentSec: { increment: elapsedSec },
      bestTimeSec,
      solvedAt: solved ? new Date() : null,
    },
  });
}

export async function setBookmarked(
  userId: string,
  questionId: string,
  bookmarked: boolean
) {
  return prisma.bankProgress.upsert({
    where: { userId_questionId: { userId, questionId } },
    create: { userId, questionId, bookmarked },
    update: { bookmarked },
  });
}

/** Banks time from a timer the user stopped without ticking the question off. */
export async function recordTime(
  userId: string,
  questionId: string,
  elapsedSec: number
) {
  if (elapsedSec <= 0) return null;

  return prisma.bankProgress.upsert({
    where: { userId_questionId: { userId, questionId } },
    create: { userId, questionId, timeSpentSec: elapsedSec, attempts: 1 },
    update: {
      timeSpentSec: { increment: elapsedSec },
      attempts: { increment: 1 },
    },
  });
}

export async function saveNotes(
  userId: string,
  questionId: string,
  notes: string
) {
  return prisma.bankProgress.upsert({
    where: { userId_questionId: { userId, questionId } },
    create: { userId, questionId, notes },
    update: { notes },
  });
}
