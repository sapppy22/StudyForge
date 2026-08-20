import * as z from "zod";
import { readJson, readQuery, withUser } from "@/lib/api";
import {
  createRevisionCards,
  getMissedFromAttempt,
} from "@/services/flashcards/flashcardService";

const Query = z.object({ attemptId: z.string().min(1) });

/**
 * A missed question the student wants carded. `questionId` identifies a graded
 * quiz answer; a mock paper has no Question row, so its questions arrive with
 * their content inline instead.
 */
const MissedSchema = z.object({
  questionId: z.string().min(1).optional(),
  topicId: z.string().min(1).nullish(),
  content: z.string().min(1).max(8000),
  correctAnswer: z.string().max(8000).nullish(),
  yourAnswer: z.string().max(8000).nullish(),
  explanation: z.string().max(20000).nullish(),
  topicTitle: z.string().max(300).nullish(),
});

const BodySchema = z.object({
  // Bounded: each card costs a model call, and twenty-five at once is already
  // more than anyone works through in a sitting.
  missed: z.array(MissedSchema).min(1).max(25),
});

/** The wrong answers on an attempt, for the picker. */
export const GET = withUser(async ({ request, user }) => {
  const { attemptId } = readQuery(request, Query);
  return getMissedFromAttempt(attemptId, user.id);
});

export const POST = withUser(async ({ request, user }) => {
  const { missed } = await readJson(request, BodySchema);
  const cards = await createRevisionCards(user.id, missed);
  return { created: cards.length, cards };
});
