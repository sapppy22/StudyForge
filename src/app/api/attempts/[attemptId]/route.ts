import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { getAttemptResults } from "@/services/tests/testService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attempt = await getAttemptResults(attemptId, user.id);
  if (!attempt)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(attempt);
}
