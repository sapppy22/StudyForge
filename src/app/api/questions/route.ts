import * as z from "zod";
import { readQuery, withUser } from "@/lib/api";
import { getQuestionsByTopic } from "@/services/questions/questionService";

const TopicQuery = z.object({ topicId: z.string().min(1) });

export const GET = withUser(async ({ request, user }) => {
  const { topicId } = readQuery(request, TopicQuery);
  return getQuestionsByTopic(topicId, user.id);
});
