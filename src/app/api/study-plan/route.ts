import * as z from "zod";
import { NextResponse } from "next/server";
import { readJson, readQuery, withUser } from "@/lib/api";
import {
  generateStudyPlan,
  getActivePlan,
} from "@/services/plans/studyPlanService";

const Query = z.object({ goalId: z.string().min(1) });

const GenerateSchema = z.object({
  goalId: z.uuid(),
  horizonDays: z.number().int().min(1).max(60).optional(),
});

export const GET = withUser(async ({ request, user }) => {
  const { goalId } = readQuery(request, Query);
  return getActivePlan(user.id, goalId);
});

export const POST = withUser(async ({ request, user }) => {
  const body = await readJson(request, GenerateSchema);
  // A goal that isn't the caller's throws NotFoundError; a goal with no topics
  // throws InvalidStateError. Both are translated by the wrapper.
  const plan = await generateStudyPlan({ userId: user.id, ...body });
  return NextResponse.json(plan, { status: 201 });
});
