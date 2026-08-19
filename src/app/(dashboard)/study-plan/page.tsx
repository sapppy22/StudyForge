import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/shared/page-header";
import { StudyPlanView } from "@/components/plan/study-plan-view";
import { listGoalSummaries } from "@/services/goals/goalService";

export const metadata: Metadata = { title: "Study plan" };

export default async function StudyPlanPage() {
  const user = await requireUser();
  const goals = await listGoalSummaries(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study plan"
        description="A day-by-day schedule weighted towards your weakest topics. It re-prioritises itself after every test."
      />
      <StudyPlanView
        goals={goals.map((g) => ({ id: g.id, title: g.title }))}
      />
    </div>
  );
}
