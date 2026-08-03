import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { createAdaptiveTest } from "@/services/questions/questionService";

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body.goalId) {
    return NextResponse.json({ error: "goalId is required" }, { status: 400 });
  }

  const test = await createAdaptiveTest(user.id, body.goalId, body.title);
  return NextResponse.json(test);
}
