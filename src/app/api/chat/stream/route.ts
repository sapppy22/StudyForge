import * as z from "zod";
import { readJson, withUser } from "@/lib/api";
import {
  prepareTutorTurn,
  saveAssistantMessage,
} from "@/services/chat/chatService";
import { buildTutorSystem, tutorReply } from "@/services/ai/tutor";
import { streamText, isAiConfigured } from "@/services/ai/client";

const BodySchema = z.object({
  sessionId: z.string().min(1),
  content: z.string().min(1).max(10000),
});

export const POST = withUser(async ({ request, user }) => {
  const body = await readJson(request, BodySchema);

  // A session that isn't the caller's throws NotFoundError, which the wrapper
  // turns into a 404 before any of the streaming machinery is set up.
  const { history, context } = await prepareTutorTurn(
    body.sessionId,
    user.id,
    body.content
  );
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
});
