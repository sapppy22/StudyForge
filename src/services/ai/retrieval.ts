import { prisma } from "@/db/prisma";

/**
 * Lightweight RAG over the user's own notes. Uses Postgres full-text search
 * (no embedding provider required) so grounding works with zero extra
 * credentials. When an embeddings pipeline is later added, vector search from
 * `findSimilarChunks` can be layered in front of this.
 */

export interface RetrievedNote {
  id: string;
  title: string;
  snippet: string;
}

interface RawRow {
  id: string;
  title: string;
  snippet: string | null;
  rank: number;
}

export async function retrieveNotes(
  topicId: string,
  userId: string,
  query?: string,
  limit = 4
): Promise<RetrievedNote[]> {
  try {
    if (query && query.trim()) {
      const rows = await prisma.$queryRaw<RawRow[]>`
        SELECT id, title,
               left(coalesce(raw_text, ''), 900) AS snippet,
               ts_rank(
                 to_tsvector('english', coalesce(raw_text, '')),
                 plainto_tsquery('english', ${query})
               ) AS rank
        FROM content_items
        WHERE topic_id = ${topicId}
          AND user_id = ${userId}
          AND raw_text IS NOT NULL
        ORDER BY rank DESC, created_at DESC
        LIMIT ${limit}
      `;
      const relevant = rows.filter((r) => r.rank > 0);
      if (relevant.length > 0) {
        return relevant.map((r) => ({
          id: r.id,
          title: r.title,
          snippet: (r.snippet ?? "").trim(),
        }));
      }
    }

    // No query, or nothing matched — fall back to the most recent notes.
    const recent = await prisma.contentItem.findMany({
      where: { topicId, userId, rawText: { not: null } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, rawText: true },
    });
    return recent.map((r) => ({
      id: r.id,
      title: r.title,
      snippet: (r.rawText ?? "").slice(0, 900).trim(),
    }));
  } catch {
    // FTS unavailable (e.g. migration not applied) — degrade to no context.
    return [];
  }
}

/** Render retrieved notes into a compact context block for prompts. */
export function formatNotesContext(notes: RetrievedNote[]): string {
  if (notes.length === 0) return "";
  return notes
    .map((n, i) => `[Note ${i + 1}: ${n.title}]\n${n.snippet}`)
    .join("\n\n");
}
