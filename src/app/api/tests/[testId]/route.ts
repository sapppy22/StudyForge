import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { getTestById } from "@/services/questions/questionService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const test = await getTestById(testId, user.id);
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(test);
}
