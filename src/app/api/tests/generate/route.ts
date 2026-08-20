import * as z from "zod";
import { Difficulty, TestType } from "@prisma/client";
import { readJson, withUser } from "@/lib/api";
import {
  createTestFromQuestions,
  generateQuestionsForTopic,
} from "@/services/questions/questionService";

const GenerateSchema = z.object({
  topicId: z.string().min(1),
  goalId: z.string().min(1),
  // Bounded because each question is a model call: an unbounded mix from the
  // client is a way to run up a bill. Past-paper questions come from the bank
  // rather than the model, so they are cheap and bounded only by sanity.
  questionMix: z
    .object({
      objective: z.number().int().min(0).max(20),
      numeric: z.number().int().min(0).max(10).optional(),
      subjective: z.number().int().min(0).max(10),
      pyq: z.number().int().min(0).max(20).optional(),
    })
    .default({ objective: 4, numeric: 2, subjective: 1, pyq: 2 }),
  difficulty: z.enum(Difficulty).or(z.literal("adaptive")).optional(),
  reason: z.string().max(500).optional(),
  title: z.string().min(1).max(200).default("Practice test"),
  type: z.enum(TestType).optional(),
});

export const POST = withUser(async ({ request, user }) => {
  const body = await readJson(request, GenerateSchema);

  const questions = await generateQuestionsForTopic({
    topicId: body.topicId,
    userId: user.id,
    goalId: body.goalId,
    questionMix: body.questionMix,
    difficulty: body.difficulty,
    reason: body.reason,
  });

  return createTestFromQuestions(
    user.id,
    body.goalId,
    [body.topicId],
    questions.map((q) => q.id),
    body.title,
    body.type
  );
});
