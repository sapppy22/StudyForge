import { NextResponse } from "next/server";
import * as z from "zod";
import { getApiUser } from "@/lib/session";
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { questionId } = await params;
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  const { solved, bookmarked, notes, elapsedSec } = parsed.data;

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

  return NextResponse.json({ ok: true });
}
