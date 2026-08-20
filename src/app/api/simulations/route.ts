import * as z from "zod";
import { ExamType } from "@prisma/client";
import { NextResponse } from "next/server";
import { readJson, readQuery, withUser } from "@/lib/api";
import { listAvailableSimulations } from "@/services/simulations/simulationService";
import { buildFullLengthPaper } from "@/services/simulations/paperService";

const Query = z.object({ examType: z.enum(ExamType).optional() });

const GenerateSchema = z.object({
  examType: z.enum(ExamType),
  title: z.string().min(1).max(200).optional(),
});

export const GET = withUser(async ({ request, user }) => {
  const { examType } = readQuery(request, Query);
  return listAvailableSimulations(user.id, examType);
});

/**
 * Builds a full-length paper to the exam's published pattern.
 *
 * Slow by nature — a 180-question NEET paper is a lot of generation — but the
 * result is stored, so it is a one-off per paper rather than per attempt.
 */
export const POST = withUser(async ({ request, user }) => {
  const body = await readJson(request, GenerateSchema);
  const paper = await buildFullLengthPaper({ userId: user.id, ...body });
  return NextResponse.json(paper, { status: 201 });
});
