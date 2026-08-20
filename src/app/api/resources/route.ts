import * as z from "zod";
import { ContentType } from "@prisma/client";
import { readJson, readQuery, withUser, notFound } from "@/lib/api";
import { getTopicById } from "@/services/goals/goalService";
import { createContentItem } from "@/services/content/contentService";
import { suggestResources } from "@/services/ai/resources";
import { examEntry } from "@/data/exams/catalog";

const Query = z.object({
  topicId: z.string().min(1),
  intent: z.enum(["learn", "practice", "revise", "test"]).optional(),
});

const SaveSchema = z.object({
  topicId: z.string().min(1),
  kind: z.enum(["video", "article"]),
  title: z.string().min(1).max(300),
  url: z.url().max(2000),
  provider: z.string().max(200).optional(),
  why: z.string().max(500).optional(),
});

/** Suggested videos and reading for one topic. */
export const GET = withUser(async ({ request, user }) => {
  const { topicId, intent } = readQuery(request, Query);

  const topic = await getTopicById(topicId, user.id);
  if (!topic) throw notFound("Topic not found");

  const subjectPath = [topic.parent?.title, topic.goal?.title].filter(Boolean).join(" · ");

  return suggestResources({
    topicTitle: topic.title,
    subjectPath: subjectPath || undefined,
    examName: topic.goal ? examEntry(topic.goal.examType)?.fullName : undefined,
    intent,
  });
});

/** Keeps a suggestion, so it sits alongside the student's own material. */
export const POST = withUser(async ({ request, user }) => {
  const body = await readJson(request, SaveSchema);

  const topic = await getTopicById(body.topicId, user.id);
  if (!topic) throw notFound("Topic not found");

  return createContentItem({
    topicId: body.topicId,
    userId: user.id,
    type: body.kind === "video" ? ContentType.video : ContentType.web_article,
    title: body.title,
    sourceUrl: body.url,
    metadata: { provider: body.provider, why: body.why, suggested: true },
  });
});
