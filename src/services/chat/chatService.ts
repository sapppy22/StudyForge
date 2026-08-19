import { prisma } from "@/db/prisma";
import { ChatRole } from "@prisma/client";
import { retrieveNotes } from "@/services/ai/retrieval";
import { tutorReply, type TutorContext } from "@/services/ai/tutor";
import type { Anthropic } from "@/services/ai/client";
import { NotFoundError } from "@/lib/errors";

export async function createChatSession(
  userId: string,
  title?: string,
  goalId?: string,
  topicId?: string
) {
  return prisma.chatSession.create({
    data: { userId, title: title ?? "New chat", goalId, topicId },
  });
}

export async function getChatSessions(userId: string) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { topic: { select: { title: true } } },
  });
}

export async function getChatMessages(sessionId: string, userId: string) {
  return prisma.chatMessage.findMany({
    where: { sessionId, session: { userId } },
    orderBy: { createdAt: "asc" },
  });
}

async function historyForModel(
  sessionId: string
): Promise<Anthropic.MessageParam[]> {
  const msgs = await prisma.chatMessage.findMany({
    where: { sessionId, role: { in: [ChatRole.user, ChatRole.assistant] } },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  return msgs.map((m) => ({
    role: m.role === ChatRole.user ? "user" : "assistant",
    content: m.content,
  }));
}

/**
 * Persists the user's message, then loads conversation history + grounding
 * context for the tutor. Shared by the non-streaming and streaming endpoints.
 */
export async function prepareTutorTurn(
  sessionId: string,
  userId: string,
  userContent: string
) {
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
    include: { topic: true, goal: true },
  });
  if (!session) throw new NotFoundError("Session not found");

  await prisma.chatMessage.create({
    data: { sessionId, role: ChatRole.user, content: userContent },
  });

  const history = await historyForModel(sessionId);
  const notes = session.topicId
    ? await retrieveNotes(session.topicId, userId, userContent, 4)
    : [];
  const context: TutorContext = {
    topicTitle: session.topic?.title ?? undefined,
    goalTitle: session.goal?.title ?? undefined,
    notes,
  };
  return { session, history, context };
}

export async function saveAssistantMessage(
  sessionId: string,
  content: string,
  context: TutorContext
) {
  return prisma.chatMessage.create({
    data: {
      sessionId,
      role: ChatRole.assistant,
      content,
      sources: context.notes.map((n) => ({ id: n.id, title: n.title })),
    },
  });
}

/** Non-streaming send (used by /api/chat POST and as a fallback path). */
export async function postChatMessage(
  sessionId: string,
  userId: string,
  content: string
) {
  const { history, context } = await prepareTutorTurn(sessionId, userId, content);
  const reply = await tutorReply(history, context);
  return saveAssistantMessage(sessionId, reply, context);
}
