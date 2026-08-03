import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import {
  createChatSession,
  getChatSessions,
  postChatMessage,
} from "@/services/chat/chatService";

export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await getChatSessions(user.id);
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (body.action === "create") {
    const session = await createChatSession(
      user.id,
      body.title,
      body.goalId,
      body.topicId
    );
    return NextResponse.json(session);
  }

  if (!body.sessionId || !body.content) {
    return NextResponse.json(
      { error: "sessionId and content are required" },
      { status: 400 }
    );
  }

  const message = await postChatMessage(body.sessionId, user.id, body.content);
  return NextResponse.json(message);
}
