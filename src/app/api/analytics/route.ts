import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWeakestTopics, getProficiencyByGoal } from "@/services/analytics/proficiencyService";
import { getTestHistory } from "@/services/tests/testService";
import { getGoalsByUser } from "@/services/goals/goalService";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await getGoalsByUser(user.id);
  const goalId = goals[0]?.id;

  const [weakest, proficiency, testHistory] = await Promise.all([
    goalId ? getWeakestTopics(user.id, goalId) : Promise.resolve([]),
    goalId ? getProficiencyByGoal(user.id, goalId) : Promise.resolve([]),
    getTestHistory(user.id),
  ]);

  return NextResponse.json({ weakest, proficiency, testHistory });
}
