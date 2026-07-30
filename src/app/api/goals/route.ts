import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGoal, getGoalsByUser } from "@/services/goals/goalService";
import { ExamType } from "@prisma/client";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await getGoalsByUser(user.id);
  return NextResponse.json(goals);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const goal = await createGoal({
    userId: user.id,
    title: body.title,
    examType: body.examType as ExamType,
    examDate: body.examDate,
    dailyStudyMinutes: body.dailyStudyMinutes,
  });

  return NextResponse.json(goal);
}
