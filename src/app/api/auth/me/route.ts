import { NextResponse } from "next/server";
import { getApiUser, isGuestUser } from "@/lib/session";

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const guest = isGuestUser(user);

  return NextResponse.json({
    user: {
      id: user.id,
      // A guest has no real address; don't hand the client a placeholder it
      // might display or mail to.
      email: guest ? null : (user.email ?? "student@studyforge.app"),
      name:
        (user.user_metadata?.name as string | undefined) ??
        (guest ? "Guest" : user.email?.split("@")[0]) ??
        "Student",
      isGuest: guest,
    },
  });
}
