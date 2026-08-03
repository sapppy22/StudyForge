import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import {
  getUnreadNotifications,
  markNotificationRead,
} from "@/services/notifications/notificationService";

export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await getUnreadNotifications(user.id);
  return NextResponse.json(notifications);
}

export async function PATCH(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  await markNotificationRead(body.id, user.id);
  return NextResponse.json({ ok: true });
}
