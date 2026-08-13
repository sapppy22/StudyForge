import { NextResponse } from "next/server";
import { Difficulty, ExamType } from "@prisma/client";
import { getApiUser } from "@/lib/session";
import {
  getBankStats,
  getBankTaxonomy,
  listBankQuestions,
  type BankFilterStatus,
} from "@/services/bank/bankService";

const STATUSES: BankFilterStatus[] = ["all", "solved", "unsolved", "bookmarked"];

export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);

  const examParam = searchParams.get("examType") ?? "JEE_MAIN";
  if (!(examParam in ExamType)) {
    return NextResponse.json({ error: "Unknown examType" }, { status: 400 });
  }
  const examType = examParam as ExamType;

  const difficultyParam = searchParams.get("difficulty");
  if (difficultyParam && !(difficultyParam in Difficulty)) {
    return NextResponse.json({ error: "Unknown difficulty" }, { status: 400 });
  }

  const statusParam = searchParams.get("status") ?? "all";
  const status = (STATUSES as string[]).includes(statusParam)
    ? (statusParam as BankFilterStatus)
    : "all";

  const [questions, taxonomy, stats] = await Promise.all([
    listBankQuestions({
      userId: user.id,
      examType,
      subject: searchParams.get("subject") ?? undefined,
      chapter: searchParams.get("chapter") ?? undefined,
      difficulty: (difficultyParam as Difficulty | null) ?? undefined,
      status,
      search: searchParams.get("search")?.trim() || undefined,
    }),
    getBankTaxonomy(examType),
    getBankStats(user.id, examType),
  ]);

  return NextResponse.json({ questions, taxonomy, stats });
}
