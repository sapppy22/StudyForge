import * as z from "zod";
import { Rating } from "@prisma/client";
import { readJson, withUser } from "@/lib/api";
import { reviewFlashcard } from "@/services/flashcards/flashcardService";

const ReviewSchema = z.object({
  flashcardId: z.string().min(1),
  rating: z.enum(Rating),
});

export const POST = withUser(async ({ request, user }) => {
  const { flashcardId, rating } = await readJson(request, ReviewSchema);
  return reviewFlashcard(flashcardId, user.id, rating);
});
