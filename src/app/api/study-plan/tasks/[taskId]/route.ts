import { NextResponse } from "next/server";
import * as z from "zod";
import { getApiUser } from "@/lib/session";
import { setTaskCompleted } from "@/services/plans/studyPlanService";

const PatchSchema = z.object({ completed: z.boolean() });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "completed is required" }, { status: 400 });
  }

  try {
    const task = await setTaskCompleted(taskId, user.id, parsed.data.completed);
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
