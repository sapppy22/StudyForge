import * as z from "zod";
import { Difficulty, ExamType } from "@prisma/client";
import { readQuery, withUser } from "@/lib/api";
import {
  getBankStats,
  getBankTaxonomy,
  listBankQuestions,
} from "@/services/bank/bankService";

const Query = z.object({
  examType: z.enum(ExamType).default(ExamType.JEE_MAIN),
  difficulty: z.enum(Difficulty).optional(),
  // An unrecognised status falls back to "all" rather than rejecting: it only
  // narrows a listing, so a stale bookmark in someone's URL bar shouldn't 400.
  status: z.enum(["all", "solved", "unsolved", "bookmarked"]).catch("all"),
  kind: z.enum(["all", "objective", "subjective"]).catch("all"),
  subject: z.string().min(1).optional(),
  chapter: z.string().min(1).optional(),
  search: z
    .string()
    .transform((value) => value.trim() || undefined)
    .optional(),
});

export const GET = withUser(async ({ request, user }) => {
  const filters = readQuery(request, Query);

  const [questions, taxonomy, stats] = await Promise.all([
    listBankQuestions({ userId: user.id, ...filters }),
    getBankTaxonomy(filters.examType),
    getBankStats(user.id, filters.examType),
  ]);

  return { questions, taxonomy, stats };
});
