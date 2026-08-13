import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? "student@studyforge.app",
      name: (user.user_metadata?.name as string | undefined) ?? user.email?.split("@")[0] ?? "Student",
    },
  });
}
