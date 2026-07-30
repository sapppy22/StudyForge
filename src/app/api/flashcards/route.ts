import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createFlashcard, getFlashcardsByTopic, seedFlashcardsForTopic } from "@/services/flashcards/flashcardService";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topicId");
  if (!topicId) return NextResponse.json({ error: "topicId required" }, { status: 400 });

  await seedFlashcardsForTopic(topicId, user.id);
  const cards = await getFlashcardsByTopic(topicId, user.id);
  return NextResponse.json(cards);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const card = await createFlashcard(body.topicId, user.id, body.front, body.back);
  return NextResponse.json(card);
}
