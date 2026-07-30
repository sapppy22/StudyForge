"use server";

import { prisma } from "@/db/prisma";
import { ContentType } from "@prisma/client";

export interface CreateContentInput {
  topicId: string;
  userId: string;
  type: ContentType;
  title: string;
  sourceUrl?: string;
  rawText?: string;
  chunks?: any[];
  metadata?: any;
}

export async function createContentItem(input: CreateContentInput) {
  return prisma.contentItem.create({
    data: {
      topicId: input.topicId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      sourceUrl: input.sourceUrl,
      rawText: input.rawText,
      chunks: input.chunks ?? [],
      metadata: input.metadata ?? {},
    },
  });
}

export async function getContentItemsByTopic(topicId: string, userId: string) {
  return prisma.contentItem.findMany({
    where: { topicId, userId },
    orderBy: { createdAt: "desc" },
  });
}
