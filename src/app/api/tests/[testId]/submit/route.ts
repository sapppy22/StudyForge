import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitTestAnswers } from "@/services/tests/testService";
import { updateProficiency } from "@/services/analytics/proficiencyService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const result = await submitTestAnswers(testId, user.id, body.answers);

  // Update proficiency based on percentage score
  const percentage = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;
  if (body.topicId) {
    await updateProficiency(body.topicId, user.id, percentage);
  }

  return NextResponse.json(result);
}
