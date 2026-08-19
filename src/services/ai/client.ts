import Groq from "groq-sdk";
import { isAiConfigured } from "@/lib/env";

/**
 * Thin wrapper around the Groq SDK.
 *
 * Every AI-backed feature degrades gracefully: when `GROQ_API_KEY` is
 * unset, `isAiConfigured()` is false and callers use deterministic offline
 * generators instead. This keeps StudyForge fully functional end-to-end
 * without any external credentials.
 */

export const AI_MODEL = "llama-3.3-70b-versatile";

/**
 * @deprecated Kept for API compatibility; Groq models do not expose an effort
 * parameter, so it is ignored.
 */
export type Effort = "low" | "medium" | "high";

const DEFAULT_MAX_TOKENS = 8192;
const DEFAULT_JSON_MAX_TOKENS = 16000;

let client: Groq | null = null;

function getClient(): Groq {
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

export { isAiConfigured };

/** Tolerantly parse a JSON value out of a model response (handles code fences). */
export function parseJson<T>(raw: string): T {
  let s = raw.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) s = fenced[1].trim();
  try {
    return JSON.parse(s) as T;
  } catch {
    const start = s.search(/[[{]/);
    const end = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
    if (start >= 0 && end > start) {
      return JSON.parse(s.slice(start, end + 1)) as T;
    }
    throw new Error("No JSON found in model response");
  }
}

function toGroqMessages(
  system: string,
  prompt: string
): Groq.Chat.ChatCompletionMessageParam[] {
  return [
    { role: "system", content: system },
    { role: "user", content: prompt },
  ];
}

/** One-shot text completion. */
export async function generateText(opts: {
  system: string;
  prompt: string;
  maxTokens?: number;
  effort?: Effort;
}): Promise<string> {
  const res = await getClient().chat.completions.create({
    model: AI_MODEL,
    max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
    messages: toGroqMessages(opts.system, opts.prompt),
  });
  return (res.choices[0]?.message?.content ?? "").trim();
}

/** One-shot completion whose text is parsed as JSON. */
export async function generateJson<T>(opts: {
  system: string;
  prompt: string;
  maxTokens?: number;
  effort?: Effort;
}): Promise<T> {
  const text = await generateText({
    ...opts,
    maxTokens: opts.maxTokens ?? DEFAULT_JSON_MAX_TOKENS,
  });
  return parseJson<T>(text);
}

/** Multi-turn completion over a message history. */
export async function generateChat(opts: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  effort?: Effort;
}): Promise<string> {
  const res = await getClient().chat.completions.create({
    model: AI_MODEL,
    max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
    messages: [{ role: "system", content: opts.system }, ...opts.messages],
  });
  return (res.choices[0]?.message?.content ?? "").trim();
}

/**
 * Streaming tutor completion — returns an text delta stream compatible with the
 * Anthropic-shaped consumer in `app/api/chat/stream/route.ts`.
 */
export function streamText(opts: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  effort?: Effort;
}) {
  const stream = getClient().chat.completions.create({
    model: AI_MODEL,
    max_tokens: opts.maxTokens ?? 16000,
    stream: true,
    messages: [{ role: "system", content: opts.system }, ...opts.messages],
  });

  return {
    [Symbol.asyncIterator]: async function* () {
      for await (const chunk of await stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
          yield {
            type: "content_block_delta",
            delta: { type: "text_delta", text },
          };
        }
      }
    },
  };
}
