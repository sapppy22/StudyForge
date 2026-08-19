import * as z from "zod";
import { TopicStatus } from "@prisma/client";
import { readJson, withUser } from "@/lib/api";
import { updateTopicStatus } from "@/services/topics/topicService";

// `status` used to be cast straight from the body into Prisma, so anything the
// client sent reached the database and came back as an opaque 500.
const StatusSchema = z.object({
  status: z.enum(TopicStatus),
});

export const PATCH = withUser<{ topicId: string }>(async ({ request, params, user }) => {
  const { status } = await readJson(request, StatusSchema);
  return updateTopicStatus(params.topicId, user.id, status);
});
