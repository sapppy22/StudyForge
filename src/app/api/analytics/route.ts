import { withUser } from "@/lib/api";
import {
  getWeakestTopics,
  getProficiencyByGoal,
} from "@/services/analytics/proficiencyService";
import { getTestHistory } from "@/services/tests/testService";
import { getPrimaryGoalId } from "@/services/goals/goalService";
import { getFlashcardStats } from "@/services/flashcards/flashcardService";

export const GET = withUser(async ({ user }) => {
  // Only the id is needed to scope the rest, and it gates two of the four
  // queries below, so it stays a separate round trip rather than a full
  // syllabus-tree load that this route then throws away.
  const goalId = await getPrimaryGoalId(user.id);

  const [weakest, proficiency, testHistory, flashcards] = await Promise.all([
    goalId ? getWeakestTopics(user.id, goalId) : Promise.resolve([]),
    goalId ? getProficiencyByGoal(user.id, goalId) : Promise.resolve([]),
    getTestHistory(user.id),
    getFlashcardStats(user.id),
  ]);

  return { weakest, proficiency, testHistory, flashcards };
});
