"use server";

import { prisma } from "@/db/prisma";
import { Rating as DbRating } from "@prisma/client";
import { createEmptyCard, fsrs, Grade } from "ts-fsrs";

const f = fsrs();

const ratingToGrade: Record<DbRating, Grade> = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 4,
};

export async function createFlashcard(
  topicId: string,
  userId: string,
  front: string,
  back: string
) {
  return prisma.flashcard.create({
    data: {
      topicId,
      userId,
      front,
      back,
    },
  });
}

export async function getDueFlashcards(userId: string, limit = 50) {
  return prisma.flashcardReview.findMany({
    where: { userId, dueDate: { lte: new Date() } },
    orderBy: { dueDate: "asc" },
    include: { flashcard: { include: { topic: true } } },
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

export async function reviewFlashcard(
  flashcardId: string,
  userId: string,
  rating: DbRating
) {
  const lastReview = await prisma.flashcardReview.findFirst({
    where: { flashcardId, userId },
    orderBy: { reviewedAt: "desc" },
  });

  const card = createEmptyCard(lastReview?.reviewedAt ?? new Date());
  const record = f.next(card, new Date(), ratingToGrade[rating]);

  return prisma.flashcardReview.create({
    data: {
      flashcardId,
      userId,
      rating,
      stability: record.card.stability,
      difficulty: record.card.difficulty,
      dueDate: record.card.due,
    },
  });
}

export async function seedFlashcardsForTopic(topicId: string, userId: string) {
  const existing = await prisma.flashcard.count({ where: { topicId, userId } });
  if (existing > 0) return;

  const topic = await prisma.syllabusTopic.findUnique({ where: { id: topicId } });
  if (!topic) return;

  await prisma.flashcard.createMany({
    data: [
      {
        topicId,
        userId,
        front: `What is the core concept of ${topic.title}?`,
        back: `A concise definition of ${topic.title}.`,
      },
      {
        topicId,
        userId,
        front: `Name one key formula related to ${topic.title}.`,
        back: `Key formula placeholder for ${topic.title}.`,
      },
    ],
  });

  const cards = await prisma.flashcard.findMany({ where: { topicId, userId } });
  await prisma.flashcardReview.createMany({
    data: cards.map((card) => ({
      flashcardId: card.id,
      userId,
      rating: DbRating.good,
      stability: 0,
      difficulty: 0,
      dueDate: new Date(),
    })),
  });
}
