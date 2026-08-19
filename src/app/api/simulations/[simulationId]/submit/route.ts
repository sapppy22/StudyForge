import * as z from "zod";
import { readJson, withUser } from "@/lib/api";
import { gradeAndSubmitSimulation } from "@/services/simulations/simulationService";

const SubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        response: z.string().max(20000),
        timeSpentSec: z.number().int().min(0).max(21600).optional(),
      })
    )
    .default([]),
  timeSpentSec: z.number().int().min(0).max(86400).default(0),
  proctoringViolations: z
    .array(
      z.object({
        timestamp: z.string(),
        type: z.enum(["tab_switch", "window_blur", "fullscreen_exit", "shortcut_blocked"]),
        details: z.string().max(500),
      })
    )
    .default([]),
});

export const POST = withUser<{ simulationId: string }>(async ({ request, params, user }) => {
  const body = await readJson(request, SubmitSchema);

  return gradeAndSubmitSimulation({
    simulationId: params.simulationId,
    userId: user.id,
    userEmail: user.email ?? "student@studyforge.app",
    userName:
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Student",
    ...body,
  });
});
