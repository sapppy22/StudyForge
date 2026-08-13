import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { getSimulationDetails } from "@/services/simulations/simulationService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ simulationId: string }> }
) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { simulationId } = await params;
  const sim = await getSimulationDetails(simulationId);

  if (!sim) {
    return NextResponse.json({ error: "Simulation not found" }, { status: 404 });
  }

  return NextResponse.json(sim);
}
