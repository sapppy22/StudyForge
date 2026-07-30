import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createTestFromQuestions,
  generateQuestionsForTopic,
} from "@/services/questions/questionService";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const questions = await generateQuestionsForTopic({
    topicId: body.topicId,
    userId: user.id,
    goalId: body.goalId,
    questionMix: body.questionMix,
    difficulty: body.difficulty,
    reason: body.reason,
  });

  const test = await createTestFromQuestions(
    user.id,
    body.goalId,
    body.topicId,
    questions.map((q) => q.id),
    body.title ?? "Practice test",
    body.type
  );

  return NextResponse.json(test);
}
