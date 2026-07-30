"use server";

import { prisma } from "@/db/prisma";
import { ChatRole } from "@prisma/client";

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
  });
}

export async function getChatMessages(sessionId: string, userId: string) {
  return prisma.chatMessage.findMany({
    where: { sessionId, session: { userId } },
    orderBy: { createdAt: "asc" },
  });
}

export async function postChatMessage(
  sessionId: string,
  userId: string,
  content: string
) {
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
    include: { topic: true },
  });
  if (!session) throw new Error("Session not found");

  await prisma.chatMessage.create({
    data: { sessionId, role: ChatRole.user, content },
  });

  // Placeholder RAG + LLM response
  const context = session.topic
    ? `Topic: ${session.topic.title}`
    : "General goal context";
  const reply = `I’m a placeholder StudyForge tutor answering in the context of ${context}. Real responses will use RAG over your notes and Claude.`;

  return prisma.chatMessage.create({
    data: {
      sessionId,
      role: ChatRole.assistant,
      content: reply,
      sources: session.topic ? [{ topicId: session.topic.id, title: session.topic.title }] : [],
    },
  });
}
