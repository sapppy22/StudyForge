import * as z from "zod";
import { readJson, withUser } from "@/lib/api";
import {
  getUnreadNotifications,
  markNotificationRead,
} from "@/services/notifications/notificationService";

const MarkReadSchema = z.object({ id: z.string().min(1) });

export const GET = withUser(async ({ user }) => getUnreadNotifications(user.id));

export const PATCH = withUser(async ({ request, user }) => {
  const { id } = await readJson(request, MarkReadSchema);
  await markNotificationRead(id, user.id);
  return { ok: true };
});
