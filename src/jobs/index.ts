import { Inngest } from "inngest";
import { prisma } from "@/db/prisma";
import { syncDueNotifications } from "@/services/notifications/notificationService";
import { applyProficiencyDecay } from "@/services/analytics/proficiencyService";
import { generateQuestionsForTopic } from "@/services/questions/questionService";

export const inngest = new Inngest({ id: "studyforge" });

/** Every morning: raise "flashcards/tests due" notifications for active users. */
export const dailyDigestJob = inngest.createFunction(
  { id: "daily-digest", triggers: [{ cron: "TZ=Asia/Kolkata 0 9 * * *" }] },
  async ({ step }) => {
    return step.run("sync-due-notifications", async () => {
      const users = await prisma.profile.findMany({ select: { id: true } });
      let processed = 0;
      for (const u of users) {
        const created = await syncDueNotifications(u.id);
        processed += created.length;
      }
      return { usersScanned: users.length, notificationsCreated: processed };
    });
  }
);

/** Weekly: decay proficiency scores so knowledge "fades" without review. */
export const weeklyReportJob = inngest.createFunction(
  { id: "weekly-report", triggers: [{ cron: "TZ=Asia/Kolkata 0 10 * * 1" }] },
  async ({ step }) => {
    return step.run("decay-proficiency", async () => {
      const users = await prisma.profile.findMany({ select: { id: true } });
      for (const u of users) await applyProficiencyDecay(u.id);
      return { usersProcessed: users.length };
    });
  }
);

/** On upload: mark a content item processed (chunking/embedding hook point). */
export const ingestionJob = inngest.createFunction(
  { id: "process-ingestion", triggers: [{ event: "ingestion/uploaded" }] },
  async ({ event, step }) => {
    return step.run("mark-processed", async () => {
      const contentItemId = event.data.contentItemId as string;
      const item = await prisma.contentItem.findUnique({
        where: { id: contentItemId },
      });
      if (!item) return { contentItemId, processed: false };
      await prisma.contentItem.update({
        where: { id: contentItemId },
        data: { processedAt: new Date() },
      });
      return { contentItemId, processed: true };
    });
  }
);

/** On demand: generate a batch of questions for a topic. */
export const questionGenerationJob = inngest.createFunction(
  { id: "generate-questions-batch", triggers: [{ event: "questions/generate" }] },
  async ({ event, step }) => {
    return step.run("generate", async () => {
      const { topicId, userId, goalId } = event.data as {
        topicId: string;
        userId: string;
        goalId: string;
      };
      const questions = await generateQuestionsForTopic({
        topicId,
        userId,
        goalId,
        questionMix: { objective: 4, subjective: 1 },
        difficulty: "adaptive",
      });
      return { topicId, generated: questions.length };
    });
  }
);

export const functions = [
  dailyDigestJob,
  weeklyReportJob,
  ingestionJob,
  questionGenerationJob,
];
