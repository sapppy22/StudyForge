import * as z from "zod";
import { notFound, readJson, withUser } from "@/lib/api";
import { sendPerformanceReportForAttempt } from "@/services/email/emailService";

const BodySchema = z.object({
  attemptId: z.string().min(1),
  proctoringViolationsCount: z.number().int().min(0).max(10000).default(0),
});

export const POST = withUser(async ({ request, user }) => {
  const { attemptId, proctoringViolationsCount } = await readJson(request, BodySchema);

  const result = await sendPerformanceReportForAttempt(
    attemptId,
    user.id,
    proctoringViolationsCount
  );
  if (!result) throw notFound("Could not generate a report for that attempt.");

  return { success: true, result };
});
