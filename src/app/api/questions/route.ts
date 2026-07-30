import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQuestionsByTopic } from "@/services/questions/questionService";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topicId");
  if (!topicId) return NextResponse.json({ error: "topicId required" }, { status: 400 });

  const questions = await getQuestionsByTopic(topicId, user.id);
  return NextResponse.json(questions);
}
