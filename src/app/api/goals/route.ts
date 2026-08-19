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

  // createGoal writes the goal plus its whole syllabus tree, so a failure here
  // is worth reporting rather than letting an unhandled rejection become an
  // opaque 500 — the client only has this body to show the user.
  try {
    const goal = await createGoal({
      userId: user.id,
      title: body.title,
      examType: body.examType as ExamType,
      examDate: body.examDate,
      dailyStudyMinutes: body.dailyStudyMinutes,
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("[api/goals] failed to create goal:", error);
    return NextResponse.json({ error: goalCreateError(error) }, { status: 500 });
  }
}

/**
 * Turn a Prisma failure into something the toast can usefully show. Database
 * configuration is by far the most common cause, and it is indistinguishable
 * from a bug unless it is named.
 */
function goalCreateError(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  const message = error instanceof Error ? error.message : "";

  if (code === "P1000" || /authentication failed|password authentication/i.test(message)) {
    return "The database rejected its credentials. Check the password in DATABASE_URL.";
  }
  if (code === "P1001" || code === "P1002" || /can't reach database/i.test(message)) {
    return "The database is unreachable. Try again in a moment.";
  }
  if (code === "P2003") {
    return "Your profile is missing, so the goal could not be linked to it. Sign out and back in.";
  }
  return "Could not create the goal. Check the server logs for the underlying error.";
}
