import * as z from "zod";
import { readJson, withUser } from "@/lib/api";
import {
  createChatSession,
  getChatSessions,
  postChatMessage,
} from "@/services/chat/chatService";

/**
 * Opening a session and posting into one are different requests sharing a
 * verb, so they're a union: a message missing its `content` can no longer be
 * read as a session-create with a stray field.
 */
const BodySchema = z.union([
  z.object({
    action: z.literal("create"),
    title: z.string().min(1).max(200).optional(),
    goalId: z.string().min(1).optional(),
    topicId: z.string().min(1).optional(),
  }),
  z.object({
    action: z.literal("message").optional(),
    sessionId: z.string().min(1),
    content: z.string().min(1).max(10000),
  }),
]);

export const GET = withUser(async ({ user }) => getChatSessions(user.id));

export const POST = withUser(async ({ request, user }) => {
  const body = await readJson(request, BodySchema);

  if (body.action === "create") {
    return createChatSession(user.id, body.title, body.goalId, body.topicId);
  }

  return postChatMessage(body.sessionId, user.id, body.content);
});
