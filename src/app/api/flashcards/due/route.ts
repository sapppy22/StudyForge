import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { getDueFlashcards } from "@/services/flashcards/flashcardService";

export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cards = await getDueFlashcards(user.id);
  return NextResponse.json({ dueToday: cards.length, cards });
}
