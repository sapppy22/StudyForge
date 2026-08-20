import { notFound, withUser } from "@/lib/api";
import { getSimulationDetails } from "@/services/simulations/simulationService";

export const GET = withUser<{ simulationId: string }>(async ({ params, user }) => {
  const sim = await getSimulationDetails(params.simulationId, user.id);
  if (!sim) throw notFound("Simulation not found");
  return sim;
});
