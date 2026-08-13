import { prisma } from "@/db/prisma";
import type { Prisma } from "@prisma/client";
import { getTopicById } from "@/services/goals/goalService";
import { retrieveNotes, type RetrievedNote } from "@/services/ai/retrieval";
import {
  countNodes,
  generateMindMap,
  type MindMapNode,
} from "@/services/ai/mindmap";

/**
 * Memory maps over a topic's notes.
 *
 * A map is built either from the whole topic (the recent/most relevant notes)
 * or from one specific note. Generation is idempotent per source: regenerating
 * replaces the existing map rather than accumulating near-duplicates, since the
 * map is a view of the notes and not a document in its own right.
 */

export interface CreateMindMapInput {
  userId: string;
  topicId: string;
  /** When set, the map covers just this note. */
  contentItemId?: string;
}

export async function createMindMap(input: CreateMindMapInput) {
  const topic = await getTopicById(input.topicId, input.userId);
  if (!topic) throw new Error("Topic not found");

  let notes: RetrievedNote[];
  let title = topic.title;

  if (input.contentItemId) {
    const item = await prisma.contentItem.findFirst({
      where: {
        id: input.contentItemId,
        userId: input.userId,
        topicId: input.topicId,
      },
      select: { id: true, title: true, rawText: true },
    });
    if (!item) throw new Error("Note not found");

    // Single-note maps read the whole note rather than the retrieval snippet —
    // there's no relevance ranking to do when the source is already chosen.
    notes = [
      { id: item.id, title: item.title, snippet: (item.rawText ?? "").trim() },
    ];
    title = item.title;
  } else {
    notes = await retrieveNotes(input.topicId, input.userId, topic.title, 5);
  }

  const { root, generatedBy } = await generateMindMap({
    topicTitle: title,
    notes,
  });

  const data = {
    userId: input.userId,
    topicId: input.topicId,
    contentItemId: input.contentItemId ?? null,
    title,
    data: root as unknown as Prisma.InputJsonValue,
    generatedBy,
    nodeCount: countNodes(root),
  };

  // One map per source: regenerating refreshes it in place.
  const existing = await prisma.mindMap.findFirst({
    where: {
      userId: input.userId,
      topicId: input.topicId,
      contentItemId: input.contentItemId ?? null,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.mindMap.update({ where: { id: existing.id }, data });
  }
  return prisma.mindMap.create({ data });
}

export async function listMindMaps(topicId: string, userId: string) {
  return prisma.mindMap.findMany({
    where: { topicId, userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function deleteMindMap(id: string, userId: string) {
  return prisma.mindMap.deleteMany({ where: { id, userId } });
}

export type { MindMapNode };
