import * as z from "zod";
import { ContentType } from "@prisma/client";
import { readJson, readQuery, withUser } from "@/lib/api";
import {
  createContentItem,
  getContentItemsByTopic,
} from "@/services/content/contentService";

const TopicQuery = z.object({ topicId: z.string().min(1) });

const CreateSchema = z.object({
  topicId: z.string().min(1),
  type: z.enum(ContentType),
  title: z.string().min(1).max(300),
  sourceUrl: z.url().optional(),
  rawText: z.string().optional(),
  chunks: z.array(z.unknown()).optional(),
  metadata: z.unknown().optional(),
});

export const GET = withUser(async ({ request, user }) => {
  const { topicId } = readQuery(request, TopicQuery);
  return getContentItemsByTopic(topicId, user.id);
});

export const POST = withUser(async ({ request, user }) => {
  const body = await readJson(request, CreateSchema);
  return createContentItem({ ...body, userId: user.id });
});
