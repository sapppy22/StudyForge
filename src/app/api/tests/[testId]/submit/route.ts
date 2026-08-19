import * as z from "zod";
import { readJson, withUser } from "@/lib/api";
import { submitTestAnswers } from "@/services/tests/testService";

const SubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        response: z.string().max(20000),
      })
    )
    .default([]),
});

export const POST = withUser<{ testId: string }>(async ({ request, params, user }) => {
  const { answers } = await readJson(request, SubmitSchema);
  // submitTestAnswers grades every question and recomputes proficiency per topic.
  return submitTestAnswers(params.testId, user.id, answers);
});
