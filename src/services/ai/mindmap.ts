import { generateJson, isAiConfigured } from "./client";
import { formatNotesContext, type RetrievedNote } from "./retrieval";

/**
 * Memory-map generation.
 *
 * Like every other AI service here, this degrades to a deterministic generator
 * when no API key is configured — the offline path parses structure out of the
 * notes themselves (headings, then bullets, then sentences) rather than
 * emitting placeholder text, so an offline map is still a usable revision aid.
 */

export interface MindMapNode {
  label: string;
  /** One-line elaboration shown under the label. */
  detail?: string;
  children?: MindMapNode[];
}

export interface GeneratedMindMap {
  root: MindMapNode;
  generatedBy: "ai" | "offline";
}

const MAX_DEPTH = 3;
const MAX_CHILDREN = 6;
const MAX_LABEL = 60;

export async function generateMindMap(params: {
  topicTitle: string;
  notes: RetrievedNote[];
}): Promise<GeneratedMindMap> {
  if (isAiConfigured()) {
    try {
      const root = await generateWithClaude(params);
      return { root: sanitize(root, 0), generatedBy: "ai" };
    } catch {
      // fall through to the offline generator
    }
  }
  return { root: sanitize(fallbackMap(params), 0), generatedBy: "offline" };
}

async function generateWithClaude(params: {
  topicTitle: string;
  notes: RetrievedNote[];
}): Promise<MindMapNode> {
  const context = formatNotesContext(params.notes);
  const system = [
    "You build memory maps (mind maps) that help a student revise a topic quickly.",
    "Produce a hierarchy: the root is the topic, each branch is a major sub-idea,",
    "and each leaf is a specific fact, formula, definition or worked relationship.",
    "Labels must be short (a few words). Put any elaboration in 'detail' — one line.",
    `Use at most ${MAX_CHILDREN} children per node and at most ${MAX_DEPTH} levels below the root.`,
    "Ground every branch in the supplied notes when notes are given.",
    'Respond with ONLY JSON: {"label": string, "detail"?: string, "children"?: [ ...same shape ]}.',
  ].join(" ");

  const prompt = [
    `Topic: ${params.topicTitle}`,
    context ? `\nNotes:\n${context}` : "",
    "\nBuild the memory map.",
  ]
    .filter(Boolean)
    .join("\n");

  return generateJson<MindMapNode>({ system, prompt, effort: "medium" });
}

/** Trims the tree to the documented shape and drops anything malformed. */
function sanitize(node: MindMapNode, depth: number): MindMapNode {
  const label = String(node?.label ?? "Untitled").trim().slice(0, MAX_LABEL);
  const detail = node?.detail ? String(node.detail).trim().slice(0, 200) : undefined;

  const children =
    depth < MAX_DEPTH && Array.isArray(node?.children)
      ? node.children
          .filter((c) => c && typeof c.label === "string" && c.label.trim())
          .slice(0, MAX_CHILDREN)
          .map((c) => sanitize(c, depth + 1))
      : undefined;

  return {
    label,
    ...(detail ? { detail } : {}),
    ...(children?.length ? { children } : {}),
  };
}

export function countNodes(node: MindMapNode): number {
  return 1 + (node.children ?? []).reduce((sum, c) => sum + countNodes(c), 0);
}

/* -------------------------------------------------------------------------- */
/*  Offline generator                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Derives a map from the notes' own structure. Tries three shapes in order:
 * Markdown headings, then bullet lists, then sentence segmentation — so it
 * produces something meaningful for both structured and free-form notes.
 */
function fallbackMap(params: {
  topicTitle: string;
  notes: RetrievedNote[];
}): MindMapNode {
  const { topicTitle, notes } = params;

  if (notes.length === 0) {
    return {
      label: topicTitle,
      detail: "Add notes to this topic to generate a memory map.",
    };
  }

  const branches: MindMapNode[] = [];

  for (const note of notes.slice(0, MAX_CHILDREN)) {
    const text = note.snippet ?? "";
    const children = headingChildren(text) ?? bulletChildren(text) ?? sentenceChildren(text);

    branches.push({
      label: truncate(note.title || "Note", MAX_LABEL),
      ...(children.length ? { children } : {}),
    });
  }

  return { label: topicTitle, children: branches };
}

function headingChildren(text: string): MindMapNode[] | null {
  const lines = text.split("\n");
  const headings = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => /^#{1,6}\s+\S/.test(line));

  if (headings.length < 2) return null;

  return headings.slice(0, MAX_CHILDREN).map(({ line, index }, i) => {
    const label = line.replace(/^#{1,6}\s+/, "");
    // Body text runs until the next heading.
    const nextIndex = headings[i + 1]?.index ?? lines.length;
    const body = lines.slice(index + 1, nextIndex).join(" ").trim();
    return {
      label: truncate(label, MAX_LABEL),
      ...(body ? { detail: truncate(body, 160) } : {}),
    };
  });
}

function bulletChildren(text: string): MindMapNode[] | null {
  const bullets = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[-*•]\s+\S/.test(l))
    .map((l) => l.replace(/^[-*•]\s+/, ""));

  if (bullets.length < 2) return null;

  return bullets.slice(0, MAX_CHILDREN).map((b) => splitLabelDetail(b));
}

function sentenceChildren(text: string): MindMapNode[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15)
    .slice(0, MAX_CHILDREN)
    .map((s) => splitLabelDetail(s));
}

/** Uses the leading clause as the label and the remainder as the detail. */
function splitLabelDetail(text: string): MindMapNode {
  const separator = text.search(/[:—–-]\s/);
  if (separator > 0 && separator < MAX_LABEL) {
    return {
      label: truncate(text.slice(0, separator).trim(), MAX_LABEL),
      detail: truncate(text.slice(separator + 1).trim(), 160),
    };
  }
  if (text.length <= MAX_LABEL) return { label: text };
  return { label: truncate(text, MAX_LABEL), detail: truncate(text, 160) };
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : clean.slice(0, max - 1).trimEnd() + "…";
}
