import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { reviewFlashcard } from "@/services/flashcards/flashcardService";
import { Rating } from "@prisma/client";

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.flashcardId || !body.rating) {
    return NextResponse.json(
      { error: "flashcardId and rating are required" },
      { status: 400 }
    );
  }

  const review = await reviewFlashcard(
    body.flashcardId,
    user.id,
    body.rating as Rating
  );
  return NextResponse.json(review);
}
