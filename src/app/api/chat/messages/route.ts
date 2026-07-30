import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatMessages } from "@/services/chat/chatService";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const messages = await getChatMessages(sessionId, user.id);
  return NextResponse.json(messages);
}
