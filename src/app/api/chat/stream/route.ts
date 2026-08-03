import { getApiUser } from "@/lib/session";
import {
  prepareTutorTurn,
  saveAssistantMessage,
} from "@/services/chat/chatService";
import { buildTutorSystem, tutorReply } from "@/services/ai/tutor";
import { streamText, isAiConfigured } from "@/services/ai/client";

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  if (!body.sessionId || !body.content) {
    return new Response("sessionId and content are required", { status: 400 });
  }

  let turn;
  try {
    turn = await prepareTutorTurn(body.sessionId, user.id, body.content);
  } catch {
    return new Response("Session not found", { status: 404 });
  }
  const { history, context } = turn;
  const encoder = new TextEncoder();

  // No API key → send the deterministic fallback as a single chunk.
  if (!isAiConfigured()) {
    const reply = await tutorReply(history, context);
    await saveAssistantMessage(body.sessionId, reply, context);
    return new Response(reply, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        const anthropicStream = streamText({
          system: buildTutorSystem(context),
          messages: history,
          maxTokens: 1536,
        });
        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            full += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch {
        if (!full) {
          full = await tutorReply(history, context);
          controller.enqueue(encoder.encode(full));
        }
      } finally {
        await saveAssistantMessage(
          body.sessionId,
          full || "(no response)",
          context
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
