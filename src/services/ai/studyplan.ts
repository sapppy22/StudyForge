import { generateJson, isAiConfigured } from "./client";

/**
 * The *language* half of study-plan generation.
 *
 * Scheduling itself is deterministic (see `studyPlanService`) — it's a
 * constrained packing problem, not a language problem, and a student is better
 * served by a plan whose ordering is explainable and reproducible. What the
 * model adds is the part it's actually good at: explaining the strategy in
 * plain English and giving per-topic coaching notes.
 */

export interface PlanTopicSummary {
  title: string;
  /** 0–100, or null when the topic has never been tested. */
  proficiency: number | null;
  status: string;
}

export interface PlanNarrative {
  rationale: string;
  /** Short "what to focus on" note per topic, keyed by topic title. */
  focus: { topic: string; note: string }[];
  generatedBy: "ai" | "offline";
}

export async function generatePlanNarrative(params: {
  goalTitle: string;
  examType: string;
  daysUntilExam: number | null;
  dailyMinutes: number;
  horizonDays: number;
  topics: PlanTopicSummary[];
}): Promise<PlanNarrative> {
  if (isAiConfigured()) {
    try {
      const result = await generateWithClaude(params);
      return { ...result, generatedBy: "ai" };
    } catch {
      // fall through
    }
  }
  return { ...fallbackNarrative(params), generatedBy: "offline" };
}

async function generateWithClaude(params: {
  goalTitle: string;
  examType: string;
  daysUntilExam: number | null;
  dailyMinutes: number;
  horizonDays: number;
  topics: PlanTopicSummary[];
}): Promise<Omit<PlanNarrative, "generatedBy">> {
  const system = [
    "You are an exam-prep coach writing the explanation for a student's study plan.",
    "The schedule itself is already fixed — do not invent dates, blocks or a different order.",
    "Write a 2-4 sentence rationale explaining the strategy, referencing the student's actual weak areas and time budget.",
    "Then give a one-line, concrete focus note for each of the listed topics — what to drill, a common trap, or what 'done' looks like.",
    'Respond with ONLY JSON: {"rationale": string, "focus": [{"topic": string, "note": string}]}.',
  ].join(" ");

  const topicLines = params.topics
    .map(
      (t) =>
        `- ${t.title} — ${
          t.proficiency === null
            ? "not yet tested"
            : `${Math.round(t.proficiency)}% proficiency`
        }, status: ${t.status}`
    )
    .join("\n");

  const prompt = [
    `Goal: ${params.goalTitle} (${params.examType})`,
    params.daysUntilExam !== null
      ? `Days until exam: ${params.daysUntilExam}`
      : "No exam date set.",
    `Daily study budget: ${params.dailyMinutes} minutes`,
    `Plan horizon: ${params.horizonDays} days`,
    "",
    "Priority topics (weakest first):",
    topicLines,
  ].join("\n");

  const parsed = await generateJson<{
    rationale?: string;
    focus?: { topic?: string; note?: string }[];
  }>({ system, prompt, effort: "medium" });

  return {
    rationale: String(parsed.rationale ?? "").trim().slice(0, 1200),
    focus: (parsed.focus ?? [])
      .filter((f) => f?.topic && f?.note)
      .map((f) => ({
        topic: String(f.topic).trim(),
        note: String(f.note).trim().slice(0, 240),
      })),
  };
}

/**
 * Deterministic narrative built from the same numbers the scheduler used, so
 * the offline plan is still self-explanatory rather than silently unexplained.
 */
function fallbackNarrative(params: {
  goalTitle: string;
  daysUntilExam: number | null;
  dailyMinutes: number;
  horizonDays: number;
  topics: PlanTopicSummary[];
}): Omit<PlanNarrative, "generatedBy"> {
  const weakest = params.topics.slice(0, 3).map((t) => t.title);
  const untested = params.topics.filter((t) => t.proficiency === null).length;

  const parts = [
    `This ${params.horizonDays}-day plan allocates your ${params.dailyMinutes} minutes a day across ${params.goalTitle}, weighting each topic by how far its proficiency sits below mastery.`,
  ];
  if (weakest.length) {
    parts.push(
      `${weakest.join(", ")} ${weakest.length === 1 ? "is" : "are"} scheduled most often because ${weakest.length === 1 ? "it is" : "they are"} currently your weakest.`
    );
  }
  if (untested > 0) {
    parts.push(
      `${untested} topic${untested === 1 ? "" : "s"} you haven't been tested on yet ${untested === 1 ? "is" : "are"} included so the plan finds out where you actually stand.`
    );
  }
  if (params.daysUntilExam !== null) {
    parts.push(
      `With ${params.daysUntilExam} days to the exam, a mock test is scheduled every seventh day to keep the priorities honest.`
    );
  }

  return {
    rationale: parts.join(" "),
    focus: params.topics.slice(0, 8).map((t) => ({
      topic: t.title,
      note:
        t.proficiency === null
          ? "Start with the core definitions and one worked example, then take a short test to establish a baseline."
          : t.proficiency < 50
            ? "Rebuild from first principles before attempting timed questions — accuracy first, speed second."
            : "Drill mixed problems under time pressure; you know the theory, so target the slips.",
    })),
  };
}
