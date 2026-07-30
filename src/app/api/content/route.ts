import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createContentItem, getContentItemsByTopic } from "@/services/content/contentService";
import { ContentType } from "@prisma/client";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topicId");
  if (!topicId) return NextResponse.json({ error: "topicId required" }, { status: 400 });

  const items = await getContentItemsByTopic(topicId, user.id);
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const item = await createContentItem({
    topicId: body.topicId,
    userId: user.id,
    type: body.type as ContentType,
    title: body.title,
    sourceUrl: body.sourceUrl,
    rawText: body.rawText,
    chunks: body.chunks,
    metadata: body.metadata,
  });
  return NextResponse.json(item);
}
