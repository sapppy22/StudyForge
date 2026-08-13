import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { listAvailableSimulations } from "@/services/simulations/simulationService";
import { ExamType } from "@prisma/client";

export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const examType = url.searchParams.get("examType") as ExamType | null;

  const simulations = await listAvailableSimulations(examType || undefined);
  return NextResponse.json(simulations);
}
