import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDueFlashcards } from "@/services/flashcards/flashcardService";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cards = await getDueFlashcards(user.id);
  return NextResponse.json({ dueToday: cards.length, cards });
}
