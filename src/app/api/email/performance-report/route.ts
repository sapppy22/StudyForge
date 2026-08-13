import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { sendPerformanceReportForAttempt } from "@/services/email/emailService";

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { attemptId, proctoringViolationsCount } = body;

  if (!attemptId) {
    return NextResponse.json({ error: "attemptId is required" }, { status: 400 });
  }

  const result = await sendPerformanceReportForAttempt(
    attemptId,
    user.id,
    proctoringViolationsCount ?? 0
  );

  if (!result) {
    return NextResponse.json({ error: "Could not generate report" }, { status: 404 });
  }

  return NextResponse.json({ success: true, result });
}
