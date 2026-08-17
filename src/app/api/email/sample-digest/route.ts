import { NextResponse } from "next/server";
import { getApiUser, isGuestUser } from "@/lib/session";
import { sendQuizDigestEmail } from "@/services/email/emailService";
import { APP_URL } from "@/lib/env";

export async function POST() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Guests have no deliverable address — say so instead of pretending to send.
  if (isGuestUser(user)) {
    return NextResponse.json(
      { error: "Create an account to receive email reports." },
      { status: 403 }
    );
  }

  const result = await sendQuizDigestEmail(
    {
      recipient: {
        email: user.email ?? "student@studyforge.app",
        name: (user.user_metadata?.name as string | undefined) ?? user.email?.split("@")[0] ?? "Student",
      },
      goalTitle: "JEE & NEET Preparation",
      period: "Weekly",
      quizzesTaken: 4,
      questionsSolved: 48,
      averageAccuracy: 84,
      streakDays: 7,
      topPerformingTopics: [
        "Kinematics & Dynamics",
        "Thermodynamics & Equilibrium",
        "Organic Reactions & Mechanisms",
      ],
      topicsNeedingReview: [
        "Optics & Wave Motion",
        "Electrochemistry & Nernst Equation",
      ],
      dashboardUrl: `${APP_URL}/dashboard`,
    },
    user.id
  );

  return NextResponse.json({ success: true, result });
}
