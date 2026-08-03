import { generateChat, isAiConfigured, type Anthropic } from "./client";
import { formatNotesContext, type RetrievedNote } from "./retrieval";

export interface TutorContext {
  topicTitle?: string;
  goalTitle?: string;
  notes: RetrievedNote[];
}

export function buildTutorSystem(ctx: TutorContext): string {
  const lines = [
    "You are StudyForge Tutor, a patient, encouraging study assistant.",
    "Explain concepts clearly and concisely, use worked examples, and check understanding.",
    "Format math and code readably. Keep answers focused — this is a study session, not an essay.",
  ];
  if (ctx.goalTitle) lines.push(`The student is preparing for: ${ctx.goalTitle}.`);
  if (ctx.topicTitle) lines.push(`Current topic: ${ctx.topicTitle}.`);
  const context = formatNotesContext(ctx.notes);
  if (context) {
    lines.push(
      "\nGround your answers in the student's own notes below when relevant, and cite which note you used:\n" +
        context
    );
  }
  return lines.join("\n");
}

/** Non-streaming reply (used by the simple send endpoint and as a fallback). */
export async function tutorReply(
  history: Anthropic.MessageParam[],
  ctx: TutorContext
): Promise<string> {
  if (isAiConfigured()) {
    try {
      return await generateChat({
        system: buildTutorSystem(ctx),
        messages: history,
        maxTokens: 1536,
      });
    } catch {
      // fall through
    }
  }
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  const text =
    typeof lastUser?.content === "string" ? lastUser.content : "your question";
  return tutorFallbackReply(text, ctx);
}

export function tutorFallbackReply(userText: string, ctx: TutorContext): string {
  const scope = ctx.topicTitle
    ? `on "${ctx.topicTitle}"`
    : ctx.goalTitle
      ? `for ${ctx.goalTitle}`
      : "for your studies";
  const noteHint =
    ctx.notes.length > 0
      ? ` I can see ${ctx.notes.length} of your note(s) on this topic — for example "${ctx.notes[0].title}".`
      : "";
  return (
    `Thanks for asking about "${userText.slice(0, 140)}". I'm the StudyForge tutor ${scope}.` +
    noteHint +
    " Connect an Anthropic API key (set ANTHROPIC_API_KEY) to unlock full, notes-grounded tutoring powered by Claude. " +
    "In the meantime, try breaking the problem into smaller steps and reviewing the relevant notes and flashcards for this topic."
  );
}
