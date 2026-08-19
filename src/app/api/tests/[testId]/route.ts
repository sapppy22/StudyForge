import { notFound, withUser } from "@/lib/api";
import { getTestById } from "@/services/questions/questionService";

export const GET = withUser<{ testId: string }>(async ({ params, user }) => {
  const test = await getTestById(params.testId, user.id);
  if (!test) throw notFound("Test not found");
  return test;
});
