import { prisma } from "@/db/prisma";

export async function updateProficiency(
  topicId: string,
  userId: string,
  score: number
) {
  const normalized = Math.min(100, Math.max(0, score));
  return prisma.proficiencyScore.upsert({
    where: { topicId_userId: { topicId, userId } },
    create: { topicId, userId, score: normalized, lastComputedAt: new Date() },
    update: { score: normalized, lastComputedAt: new Date() },
  });
}

/**
 * Recomputes a topic's proficiency from the user's most recent graded answers
 * on that topic (recency-weighted accuracy). Called after every test submit.
 */
export async function recomputeTopicProficiency(
  userId: string,
  topicId: string
) {
  const answers = await prisma.answer.findMany({
    where: { attempt: { userId }, question: { topicId } },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { score: true, maxScore: true },
  });
  if (answers.length === 0) return null;

  // Recency weighting: newer answers count more.
  let weightedScore = 0;
  let weightedMax = 0;
  answers.forEach((a, i) => {
    const weight = 1 / (1 + i * 0.15);
    weightedScore += (a.score ?? 0) * weight;
    weightedMax += (a.maxScore || 0) * weight;
  });

  const pct = weightedMax > 0 ? (weightedScore / weightedMax) * 100 : 0;
  return updateProficiency(topicId, userId, pct);
}

export async function applyProficiencyDecay(userId: string) {
  const scores = await prisma.proficiencyScore.findMany({ where: { userId } });
  for (const s of scores) {
    const daysSince =
      (Date.now() - s.lastComputedAt.getTime()) / (1000 * 60 * 60 * 24);
    const decay = s.decayRate * daysSince;
    const newScore = Math.max(0, s.score - decay);
    await prisma.proficiencyScore.update({
      where: { id: s.id },
      data: { score: newScore, lastComputedAt: new Date() },
    });
  }
}

export async function getWeakestTopics(
  userId: string,
  goalId: string,
  limit = 5
) {
  return prisma.proficiencyScore.findMany({
    where: { userId, topic: { goalId } },
    orderBy: { score: "asc" },
    include: { topic: true },
    take: limit,
  });
}

export async function getProficiencyByGoal(userId: string, goalId: string) {
  return prisma.proficiencyScore.findMany({
    where: { userId, topic: { goalId } },
    include: { topic: true },
  });
}
