import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { prisma } from "@/db/prisma";

export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tests = await prisma.test.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { questions: true } },
      attempts: {
        where: { status: "graded" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, score: true, maxScore: true, createdAt: true },
      },
    },
  });
  return NextResponse.json(tests);
}
