import { NextResponse } from "next/server";
import * as z from "zod";
import { getApiUser } from "@/lib/session";
import { createMindMap, listMindMaps } from "@/services/mindmaps/mindMapService";

const CreateSchema = z.object({
  topicId: z.uuid(),
  contentItemId: z.uuid().optional(),
});

export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const topicId = new URL(request.url).searchParams.get("topicId");
  if (!topicId)
    return NextResponse.json({ error: "topicId required" }, { status: 400 });

  return NextResponse.json(await listMindMaps(topicId, user.id));
}

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = CreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  try {
    const map = await createMindMap({ userId: user.id, ...parsed.data });
    return NextResponse.json(map, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    // "not found" here means the topic or note isn't the caller's.
    const status = /not found/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
