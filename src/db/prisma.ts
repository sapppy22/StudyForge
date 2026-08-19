import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function ensurePgvectorExtension() {
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
}

export async function findSimilarChunks(
  embedding: number[],
  topicId: string,
  userId: string,
  limit = 5,
  minSimilarity = 0.7
) {
  const vectorLiteral = `[${embedding.join(",")}]`;
  const rows = await prisma.$queryRawUnsafe<
    { id: string; raw_text: string | null; similarity: number }[]
  >(
    // The similarity floor is a row-level predicate, so it belongs in WHERE.
    // As HAVING it made Postgres treat the query as a single aggregate group
    // and reject `embedding` for not appearing in a GROUP BY, so this never
    // returned a row. The casts keep the parameter types unambiguous.
    `
    SELECT id, raw_text, 1 - (embedding <=> $1::vector) AS similarity
    FROM content_items
    WHERE topic_id = $2
      AND user_id = $3
      AND embedding IS NOT NULL
      AND 1 - (embedding <=> $1::vector) >= $4::float8
    ORDER BY embedding <=> $1::vector
    LIMIT $5::int
    `,
    vectorLiteral,
    topicId,
    userId,
    minSimilarity,
    limit
  );
  return rows;
}
