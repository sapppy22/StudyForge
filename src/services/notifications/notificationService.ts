"use server";

import { prisma } from "@/db/prisma";
import { NotificationType } from "@prisma/client";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  dueAt?: Date
) {
  return prisma.notification.create({
    data: { userId, type, title, body, dueAt },
  });
}

export async function getUnreadNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId, readAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function markNotificationRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
}

export async function getDueItems(userId: string) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const [flashcards, tests] = await Promise.all([
    prisma.flashcardReview.findMany({
      where: { userId, dueDate: { lte: today } },
      include: { flashcard: true },
    }),
    prisma.test.findMany({
      where: { userId, status: { in: ["scheduled", "ready"] }, scheduledAt: { lte: today } },
    }),
  ]);
  return { flashcards, tests };
}
