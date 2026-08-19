import * as z from "zod";
import { readQuery, withUser } from "@/lib/api";
import { getChatMessages } from "@/services/chat/chatService";

const Query = z.object({ sessionId: z.string().min(1) });

export const GET = withUser(async ({ request, user }) => {
  const { sessionId } = readQuery(request, Query);
  return getChatMessages(sessionId, user.id);
});
