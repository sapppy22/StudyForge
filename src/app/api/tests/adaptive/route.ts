import * as z from "zod";
import { readJson, withUser } from "@/lib/api";
import { createAdaptiveTest } from "@/services/questions/questionService";

const AdaptiveSchema = z.object({
  goalId: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
});

export const POST = withUser(async ({ request, user }) => {
  const { goalId, title } = await readJson(request, AdaptiveSchema);
  return createAdaptiveTest(user.id, goalId, title);
});
