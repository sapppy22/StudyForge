import { notFound, withUser } from "@/lib/api";
import { getAttemptResults } from "@/services/tests/testService";

export const GET = withUser<{ attemptId: string }>(async ({ params, user }) => {
  const attempt = await getAttemptResults(params.attemptId, user.id);
  if (!attempt) throw notFound("Attempt not found");
  return attempt;
});
