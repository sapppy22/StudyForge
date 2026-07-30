import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "studyforge" });

export const dailyDigestJob = inngest.createFunction(
  { id: "daily-digest", triggers: [{ cron: "TZ=Asia/Kolkata 0 9 * * *" }] },
  async ({ step }) => {
    await step.run("aggregate-due-items", async () => {
      return { processed: 0 };
    });
  }
);

export const weeklyReportJob = inngest.createFunction(
  { id: "weekly-report", triggers: [{ cron: "TZ=Asia/Kolkata 0 10 * * 1" }] },
  async ({ step }) => {
    await step.run("decay-proficiency", async () => {
      return { usersProcessed: 0 };
    });
  }
);

export const ingestionJob = inngest.createFunction(
  { id: "process-ingestion", triggers: [{ event: "ingestion/uploaded" }] },
  async ({ event, step }) => {
    await step.run("ocr-and-chunk", async () => {
      return { contentItemId: event.data.contentItemId as string };
    });
  }
);

export const questionGenerationJob = inngest.createFunction(
  { id: "generate-questions-batch", triggers: [{ event: "questions/generate" }] },
  async ({ event, step }) => {
    await step.run("generate", async () => {
      return { topicId: event.data.topicId as string };
    });
  }
);

export const functions = [dailyDigestJob, weeklyReportJob, ingestionJob, questionGenerationJob];
