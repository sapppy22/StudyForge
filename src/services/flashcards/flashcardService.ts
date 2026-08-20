import { prisma } from "@/db/prisma";
import { Prisma, Rating as DbRating, FlashcardSource } from "@prisma/client";
import { createEmptyCard, fsrs, type Card, type Grade } from "ts-fsrs";
import { retrieveNotes } from "@/services/ai/retrieval";
import {
  generateFlashcards,
  generateRevisionCards,
  type MissedQuestion,
} from "@/services/ai/flashcards";
import { NotFoundError } from "@/lib/errors";

const f = fsrs();

const ratingToGrade: Record<DbRating, Grade> = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 4,
};

// ts-fsrs Cards carry Date fields; the Prisma Json column needs plain values.
function serializeCard(card: Card): Prisma.InputJsonValue {
  const out: Record<string, unknown> = {
    ...card,
    due: card.due.toISOString(),
  };
  if (card.last_review) out.last_review = card.last_review.toISOString();
  else delete out.last_review;
  return out as Prisma.InputJsonValue;
}

function deserializeCard(json: unknown): Card {
  const c = json as Record<string, unknown>;
  return {
    ...(c as unknown as Card),
    due: new Date(c.due as string),
    last_review: c.last_review ? new Date(c.last_review as string) : undefined,
  } as Card;
}

export async function createFlashcard(
  topicId: string | null,
  userId: string,
  front: string,
  back: string,
  source: FlashcardSource = FlashcardSource.manual,
  metadata?: Prisma.InputJsonValue
) {
  const card = createEmptyCard(new Date()); // due = now → immediately reviewable
  return prisma.flashcard.create({
    data: {
      topicId,
      userId,
      front,
      back,
      source,
      metadata,
      due: card.due,
      fsrsState: serializeCard(card),
      reps: card.reps,
      lapses: card.lapses,
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Revision cards from mistakes                                               */
/* -------------------------------------------------------------------------- */

export interface MissedQuestionInput {
  /** The graded question — set for a quiz answer, absent for a mock paper. */
  questionId?: string;
  topicId?: string | null;
  content: string;
  correctAnswer?: string | null;
  yourAnswer?: string | null;
  explanation?: string | null;
  topicTitle?: string | null;
}

/**
 * Turns chosen mistakes into revision cards.
 *
 * Chosen, not automatic: a student knows which of their wrong answers was a
 * slip and which was a hole, and burying the holes under a pile of cards for
 * arithmetic errors is how a review queue stops being worth opening. The
 * caller picks; this schedules what they picked.
 *
 * Cards go in due immediately, because the whole point is to close the gap
 * while the mistake is still fresh.
 */
export async function createRevisionCards(
  userId: string,
  missed: MissedQuestionInput[]
) {
  if (missed.length === 0) return [];

  // A question already turned into a card must not spawn a second one when the
  // student opens the same scorecard again. Filtered in memory rather than with
  // a JSON-path query: the set is one user's revision cards, and the equivalent
  // `IN` over a JSON field is not expressible in Prisma.
  const questionIds = missed.map((m) => m.questionId).filter(Boolean) as string[];
  const existing = questionIds.length
    ? await prisma.flashcard.findMany({
        where: { userId, source: FlashcardSource.from_missed_question },
        select: { metadata: true },
      })
    : [];

  const alreadyCarded = new Set(
    existing
      .map((row) => (row.metadata as { questionId?: string } | null)?.questionId)
      .filter(Boolean) as string[]
  );

  const pending = missed.filter(
    (m) => !m.questionId || !alreadyCarded.has(m.questionId)
  );
  if (pending.length === 0) return [];

  const cards = await generateRevisionCards(
    pending.map(
      (m): MissedQuestion => ({
        content: m.content,
        correctAnswer: m.correctAnswer,
        yourAnswer: m.yourAnswer,
        explanation: m.explanation,
        topicTitle: m.topicTitle,
      })
    )
  );

  const created = [];
  for (const [index, card] of cards.entries()) {
    const origin = pending[index];
    created.push(
      await createFlashcard(
        origin?.topicId ?? null,
        userId,
        card.front,
        card.back,
        FlashcardSource.from_missed_question,
        {
          questionId: origin?.questionId ?? null,
          originalQuestion: origin?.content ?? null,
          yourAnswer: origin?.yourAnswer ?? null,
        } as Prisma.InputJsonValue
      )
    );
  }
  return created;
}

/**
 * The wrong answers on a graded attempt, ready to be turned into cards.
 *
 * Unanswered questions count as missed — not knowing where to start is a
 * bigger gap than getting it wrong, not a smaller one.
 */
export async function getMissedFromAttempt(attemptId: string, userId: string) {
  const attempt = await prisma.testAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      answers: {
        include: { question: { include: { topic: { select: { id: true, title: true } } } } },
      },
    },
  });
  if (!attempt) throw new NotFoundError("Attempt not found");

  return attempt.answers
    .filter((answer) => answer.isCorrect !== true)
    .map((answer) => ({
      questionId: answer.questionId,
      topicId: answer.question.topicId,
      topicTitle: answer.question.topic?.title ?? null,
      content: answer.question.content,
      correctAnswer: answer.question.correctAnswer,
      yourAnswer: answer.response || null,
      explanation: answer.question.explanation,
    }));
}

/** Cards whose scheduled `due` time has passed (includes brand-new cards). */
export async function getDueFlashcards(userId: string, limit = 50) {
  return prisma.flashcard.findMany({
    where: { userId, due: { lte: new Date() } },
    orderBy: { due: "asc" },
    include: { topic: { select: { id: true, title: true } } },
    take: limit,
  });
}

export async function getFlashcardsByTopic(topicId: string, userId: string) {
  return prisma.flashcard.findMany({
    where: { topicId, userId },
    include: { reviews: { orderBy: { reviewedAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Applies an FSRS review. Correctly carries the previous card state forward
 * (stability/difficulty/state/reps) instead of starting from an empty card,
 * so scheduling actually progresses. Also records a review-history row.
 */
export async function reviewFlashcard(
  flashcardId: string,
  userId: string,
  rating: DbRating
) {
  const flashcard = await prisma.flashcard.findFirst({
    where: { id: flashcardId, userId },
  });
  if (!flashcard) throw new NotFoundError("Flashcard not found");

  const now = new Date();
  const previous: Card = flashcard.fsrsState
    ? deserializeCard(flashcard.fsrsState)
    : createEmptyCard(flashcard.createdAt);

  const { card: next } = f.next(previous, now, ratingToGrade[rating]);

  await prisma.flashcard.update({
    where: { id: flashcardId },
    data: {
      due: next.due,
      fsrsState: serializeCard(next),
      reps: next.reps,
      lapses: next.lapses,
      lastReview: now,
    },
  });

  return prisma.flashcardReview.create({
    data: {
      flashcardId,
      userId,
      rating,
      stability: next.stability,
      difficulty: next.difficulty,
      dueDate: next.due,
      reviewedAt: now,
    },
  });
}

/** Generate flashcards for a topic from the user's notes (AI or fallback). */
export async function generateFlashcardsForTopic(
  topicId: string,
  userId: string,
  count = 6
) {
  const topic = await prisma.syllabusTopic.findFirst({
    where: { id: topicId, goal: { userId } },
  });
  if (!topic) throw new NotFoundError("Topic not found");

  const notes = await retrieveNotes(topicId, userId, undefined, 5);
  const cards = await generateFlashcards({
    topicTitle: topic.title,
    notes,
    count,
  });

  const created = [];
  for (const c of cards) {
    created.push(
      await createFlashcard(
        topicId,
        userId,
        c.front,
        c.back,
        FlashcardSource.auto_from_notes
      )
    );
  }
  return created;
}

/** Ensures a topic has at least a few starter cards (used lazily, offline-fast). */
export async function seedFlashcardsForTopic(topicId: string, userId: string) {
  const existing = await prisma.flashcard.count({ where: { topicId, userId } });
  if (existing > 0) return;
  await generateFlashcardsForTopic(topicId, userId, 4);
}

/** Aggregate review stats for a user (for analytics). */
export async function getFlashcardStats(userId: string) {
  const [total, due, reviews] = await Promise.all([
    prisma.flashcard.count({ where: { userId } }),
    prisma.flashcard.count({ where: { userId, due: { lte: new Date() } } }),
    prisma.flashcardReview.count({ where: { userId } }),
  ]);
  return { total, due, reviews };
}
