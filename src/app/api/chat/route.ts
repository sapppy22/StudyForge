import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createChatSession, getChatSessions, postChatMessage } from "@/services/chat/chatService";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await getChatSessions(user.id);
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (body.action === "create") {
    const session = await createChatSession(user.id, body.title, body.goalId, body.topicId);
    return NextResponse.json(session);
  }

  const message = await postChatMessage(body.sessionId, user.id, body.content);
  return NextResponse.json(message);
}
