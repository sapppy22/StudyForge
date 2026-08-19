import { notFound, withUser } from "@/lib/api";
import { getSimulationDetails } from "@/services/simulations/simulationService";

export const GET = withUser<{ simulationId: string }>(async ({ params }) => {
  const sim = await getSimulationDetails(params.simulationId);
  if (!sim) throw notFound("Simulation not found");
  return sim;
});
