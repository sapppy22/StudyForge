import * as z from "zod";
import { ExamType } from "@prisma/client";
import { readQuery, withUser } from "@/lib/api";
import { listAvailableSimulations } from "@/services/simulations/simulationService";

const Query = z.object({ examType: z.enum(ExamType).optional() });

export const GET = withUser(async ({ request }) => {
  const { examType } = readQuery(request, Query);
  return listAvailableSimulations(examType);
});
