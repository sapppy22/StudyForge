import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import {
  createFlashcard,
  generateFlashcardsForTopic,
  getFlashcardsByTopic,
} from "@/services/flashcards/flashcardService";

export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topicId");
  if (!topicId)
    return NextResponse.json({ error: "topicId required" }, { status: 400 });

  const cards = await getFlashcardsByTopic(topicId, user.id);
  return NextResponse.json(cards);
}

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.topicId)
    return NextResponse.json({ error: "topicId required" }, { status: 400 });

  if (body.action === "generate") {
    const cards = await generateFlashcardsForTopic(
      body.topicId,
      user.id,
      body.count ?? 6
    );
    return NextResponse.json(cards);
  }

  if (!body.front || !body.back) {
    return NextResponse.json(
      { error: "front and back are required" },
      { status: 400 }
    );
  }

  const card = await createFlashcard(
    body.topicId,
    user.id,
    body.front,
    body.back
  );
  return NextResponse.json(card);
}
