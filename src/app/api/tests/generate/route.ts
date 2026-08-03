import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import {
  createTestFromQuestions,
  generateQuestionsForTopic,
} from "@/services/questions/questionService";

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.topicId || !body.goalId) {
    return NextResponse.json(
      { error: "topicId and goalId are required" },
      { status: 400 }
    );
  }

  const questionMix = body.questionMix ?? { objective: 4, subjective: 1 };

  const questions = await generateQuestionsForTopic({
    topicId: body.topicId,
    userId: user.id,
    goalId: body.goalId,
    questionMix,
    difficulty: body.difficulty,
    reason: body.reason,
  });

  const test = await createTestFromQuestions(
    user.id,
    body.goalId,
    [body.topicId],
    questions.map((q) => q.id),
    body.title ?? "Practice test",
    body.type
  );

  return NextResponse.json(test);
}
