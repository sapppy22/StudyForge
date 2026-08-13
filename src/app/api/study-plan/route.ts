import { NextResponse } from "next/server";
import * as z from "zod";
import { getApiUser } from "@/lib/session";
import {
  generateStudyPlan,
  getActivePlan,
} from "@/services/plans/studyPlanService";

const GenerateSchema = z.object({
  goalId: z.uuid(),
  horizonDays: z.number().int().min(1).max(60).optional(),
});

export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goalId = new URL(request.url).searchParams.get("goalId");
  if (!goalId)
    return NextResponse.json({ error: "goalId required" }, { status: 400 });

  const plan = await getActivePlan(user.id, goalId);
  return NextResponse.json(plan);
}

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = GenerateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  try {
    const plan = await generateStudyPlan({ userId: user.id, ...parsed.data });
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not build a plan";
    return NextResponse.json(
      { error: message },
      { status: /not found/i.test(message) ? 404 : 400 }
    );
  }
}
