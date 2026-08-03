import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { submitTestAnswers } from "@/services/tests/testService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  // submitTestAnswers grades every question and recomputes proficiency per topic.
  const result = await submitTestAnswers(testId, user.id, body.answers ?? []);
  return NextResponse.json(result);
}
