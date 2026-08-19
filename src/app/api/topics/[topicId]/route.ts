import { notFound, withUser } from "@/lib/api";
import { getTopicById } from "@/services/goals/goalService";

export const GET = withUser<{ topicId: string }>(async ({ params, user }) => {
  const topic = await getTopicById(params.topicId, user.id);
  if (!topic) throw notFound("Topic not found");
  return topic;
});
