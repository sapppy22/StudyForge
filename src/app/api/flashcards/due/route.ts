import { withUser } from "@/lib/api";
import { getDueFlashcards } from "@/services/flashcards/flashcardService";

export const GET = withUser(async ({ user }) => {
  const cards = await getDueFlashcards(user.id);
  return { dueToday: cards.length, cards };
});
