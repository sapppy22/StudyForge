import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import {
  getWeakestTopics,
  getProficiencyByGoal,
} from "@/services/analytics/proficiencyService";
import { getTestHistory } from "@/services/tests/testService";
import { getGoalsByUser } from "@/services/goals/goalService";
import { getFlashcardStats } from "@/services/flashcards/flashcardService";

export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await getGoalsByUser(user.id);
  const goalId = goals[0]?.id;

  const [weakest, proficiency, testHistory, flashcards] = await Promise.all([
    goalId ? getWeakestTopics(user.id, goalId) : Promise.resolve([]),
    goalId ? getProficiencyByGoal(user.id, goalId) : Promise.resolve([]),
    getTestHistory(user.id),
    getFlashcardStats(user.id),
  ]);

  return NextResponse.json({ weakest, proficiency, testHistory, flashcards });
}
