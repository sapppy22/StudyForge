import { prisma } from "@/db/prisma";
import { TopicStatus } from "@prisma/client";
import { NotFoundError } from "@/lib/errors";

export async function updateTopicStatus(
  topicId: string,
  userId: string,
  status: TopicStatus
) {
  const topic = await prisma.syllabusTopic.findFirst({
    where: { id: topicId, goal: { userId } },
  });
  if (!topic) throw new NotFoundError("Topic not found");

  return prisma.syllabusTopic.update({
    where: { id: topicId },
    data: { status },
  });
}

export async function listTopicsByGoal(goalId: string, userId: string) {
  return prisma.syllabusTopic.findMany({
    where: { goalId, goal: { userId } },
    include: { proficiencyScores: { where: { userId } } },
    orderBy: { orderIndex: "asc" },
  });
}

