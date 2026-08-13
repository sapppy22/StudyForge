import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { gradeAndSubmitSimulation } from "@/services/simulations/simulationService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ simulationId: string }> }
) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { simulationId } = await params;
  const body = await request.json();

  const { answers, timeSpentSec, proctoringViolations } = body;

  try {
    const result = await gradeAndSubmitSimulation({
      simulationId,
      userId: user.id,
      userEmail: user.email ?? "student@studyforge.app",
      userName: (user.user_metadata?.name as string | undefined) ?? user.email?.split("@")[0] ?? "Student",
      answers: answers || [],
      timeSpentSec: timeSpentSec || 0,
      proctoringViolations: proctoringViolations || [],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[SimulationSubmit] Error grading simulation:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to grade simulation" },
      { status: 500 }
    );
  }
}
