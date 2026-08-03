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

/** Items the user should act on today: due flashcards and pending tests. */
export async function getDueItems(userId: string) {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [flashcards, tests] = await Promise.all([
    prisma.flashcard.findMany({
      where: { userId, due: { lte: endOfToday } },
      select: { id: true },
    }),
    prisma.test.findMany({
      where: { userId, status: { in: ["scheduled", "ready"] } },
      select: { id: true },
    }),
  ]);
  return { flashcards, tests };
}

/**
 * Creates "due" notifications for a user, de-duplicating against unread
 * notifications already raised today. Used by the daily digest job.
 */
export async function syncDueNotifications(userId: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { flashcards, tests } = await getDueItems(userId);
  const created = [];

  if (flashcards.length > 0) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: NotificationType.flashcards_due,
        readAt: null,
        createdAt: { gte: startOfToday },
      },
    });
    if (!existing) {
      created.push(
        await createNotification(
          userId,
          NotificationType.flashcards_due,
          `${flashcards.length} flashcard${flashcards.length === 1 ? "" : "s"} due`,
          `You have ${flashcards.length} card${flashcards.length === 1 ? "" : "s"} ready to review today.`
        )
      );
    }
  }

  if (tests.length > 0) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: NotificationType.test_due,
        readAt: null,
        createdAt: { gte: startOfToday },
      },
    });
    if (!existing) {
      created.push(
        await createNotification(
          userId,
          NotificationType.test_due,
          `${tests.length} test${tests.length === 1 ? "" : "s"} ready`,
          `You have ${tests.length} practice test${tests.length === 1 ? "" : "s"} waiting.`
        )
      );
    }
  }

  return created;
}
