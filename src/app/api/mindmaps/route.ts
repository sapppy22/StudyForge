import * as z from "zod";
import { NextResponse } from "next/server";
import { readJson, readQuery, withUser } from "@/lib/api";
import { createMindMap, listMindMaps } from "@/services/mindmaps/mindMapService";

const TopicQuery = z.object({ topicId: z.string().min(1) });

const CreateSchema = z.object({
  topicId: z.uuid(),
  contentItemId: z.uuid().optional(),
});

export const GET = withUser(async ({ request, user }) => {
  const { topicId } = readQuery(request, TopicQuery);
  return listMindMaps(topicId, user.id);
});

export const POST = withUser(async ({ request, user }) => {
  const body = await readJson(request, CreateSchema);
  const map = await createMindMap({ userId: user.id, ...body });
  // A topic or note that isn't the caller's surfaces as NotFoundError from the
  // service, which the wrapper turns into a 404.
  return NextResponse.json(map, { status: 201 });
});
