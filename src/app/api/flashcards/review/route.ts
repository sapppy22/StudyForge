import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reviewFlashcard } from "@/services/flashcards/flashcardService";
import { Rating } from "@prisma/client";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const review = await reviewFlashcard(body.flashcardId, user.id, body.rating as Rating);
  return NextResponse.json(review);
}
