import * as z from "zod";
import { readJson, withUser } from "@/lib/api";
import { setTaskCompleted } from "@/services/plans/studyPlanService";

const PatchSchema = z.object({ completed: z.boolean() });

export const PATCH = withUser<{ taskId: string }>(async ({ request, params, user }) => {
  const { completed } = await readJson(request, PatchSchema);
  return setTaskCompleted(params.taskId, user.id, completed);
});
