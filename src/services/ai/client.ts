import Anthropic from "@anthropic-ai/sdk";
import { isAiConfigured } from "@/lib/env";

/**
 * Thin wrapper around the official Anthropic SDK.
 *
 * Every AI-backed feature degrades gracefully: when `ANTHROPIC_API_KEY` is
 * unset, `isAiConfigured()` is false and callers use deterministic offline
 * generators instead. This keeps StudyForge fully functional end-to-end
 * without any external credentials.
 */

export const AI_MODEL = "claude-opus-4-8";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) client = new Anthropic(); // resolves ANTHROPIC_API_KEY from env
  return client;
}

export { isAiConfigured };

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

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

/** One-shot text completion. */
export async function generateText(opts: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const msg = await getClient().messages.create({
    model: AI_MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });
  return extractText(msg.content);
}

/** One-shot completion whose text is parsed as JSON. */
export async function generateJson<T>(opts: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<T> {
  const text = await generateText({ ...opts, maxTokens: opts.maxTokens ?? 4096 });
  return parseJson<T>(text);
}

/** Multi-turn completion over a message history. */
export async function generateChat(opts: {
  system: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
}): Promise<string> {
  const msg = await getClient().messages.create({
    model: AI_MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    system: opts.system,
    messages: opts.messages,
  });
  return extractText(msg.content);
}

/** Streaming tutor completion — returns a text stream of assistant deltas. */
export function streamText(opts: {
  system: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
}) {
  return getClient().messages.stream({
    model: AI_MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    system: opts.system,
    messages: opts.messages,
  });
}

export type { Anthropic };
