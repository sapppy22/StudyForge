import * as z from "zod";
import { readJson, withUser } from "@/lib/api";
import {
  recordTime,
  saveNotes,
  setBookmarked,
  setSolved,
} from "@/services/bank/bankService";

const PatchSchema = z.object({
  solved: z.boolean().optional(),
  bookmarked: z.boolean().optional(),
  notes: z.string().max(4000).optional(),
  /** Seconds on the timer for this attempt. Capped at 6 hours as a sanity bound. */
  elapsedSec: z.number().int().min(0).max(21600).optional(),
});

export const PATCH = withUser<{ questionId: string }>(async ({ request, params, user }) => {
  const { solved, bookmarked, notes, elapsedSec } = await readJson(request, PatchSchema);
  const { questionId } = params;

  // `setSolved` already banks the elapsed time, so only record it separately
  // when the user stopped the timer without ticking the question off.
  if (solved !== undefined) {
    await setSolved(user.id, questionId, solved, elapsedSec ?? 0);
  } else if (elapsedSec) {
    await recordTime(user.id, questionId, elapsedSec);
  }

  if (bookmarked !== undefined) {
    await setBookmarked(user.id, questionId, bookmarked);
  }
  if (notes !== undefined) {
    await saveNotes(user.id, questionId, notes);
  }

  return { ok: true };
});
