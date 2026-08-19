import * as z from "zod";
import { readJson, readQuery, withUser } from "@/lib/api";
import {
  createFlashcard,
  generateFlashcardsForTopic,
  getFlashcardsByTopic,
} from "@/services/flashcards/flashcardService";

const TopicQuery = z.object({ topicId: z.string().min(1) });

/**
 * Either generate a deck for a topic or add one card by hand. The two shapes
 * are a union rather than a bag of optional fields so that a malformed
 * hand-written card can't silently fall through to the generator.
 */
const BodySchema = z.union([
  z.object({
    action: z.literal("generate"),
    topicId: z.string().min(1),
    count: z.number().int().min(1).max(50).default(6),
  }),
  z.object({
    action: z.literal("create").optional(),
    topicId: z.string().min(1),
    front: z.string().min(1).max(2000),
    back: z.string().min(1).max(4000),
  }),
]);

export const GET = withUser(async ({ request, user }) => {
  const { topicId } = readQuery(request, TopicQuery);
  return getFlashcardsByTopic(topicId, user.id);
});

export const POST = withUser(async ({ request, user }) => {
  const body = await readJson(request, BodySchema);

  if (body.action === "generate") {
    return generateFlashcardsForTopic(body.topicId, user.id, body.count);
  }

  return createFlashcard(body.topicId, user.id, body.front, body.back);
});
