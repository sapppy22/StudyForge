import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { updateTopicStatus } from "@/services/topics/topicService";
import { TopicStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const topic = await updateTopicStatus(
    topicId,
    user.id,
    body.status as TopicStatus
  );
  return NextResponse.json(topic);
}
