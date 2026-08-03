import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { getChatMessages } from "@/services/chat/chatService";

export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId)
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const messages = await getChatMessages(sessionId, user.id);
  return NextResponse.json(messages);
}
