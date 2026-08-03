import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { createGoal, getGoalsByUser } from "@/services/goals/goalService";
import { ExamType } from "@prisma/client";

export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await getGoalsByUser(user.id);
  return NextResponse.json(goals);
}

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.title || !body.examType) {
    return NextResponse.json(
      { error: "title and examType are required" },
      { status: 400 }
    );
  }

  const goal = await createGoal({
    userId: user.id,
    title: body.title,
    examType: body.examType as ExamType,
    examDate: body.examDate,
    dailyStudyMinutes: body.dailyStudyMinutes,
  });

  return NextResponse.json(goal);
}
