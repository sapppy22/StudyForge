import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { getTopicById } from "@/services/goals/goalService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const topic = await getTopicById(topicId, user.id);
  if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(topic);
}
