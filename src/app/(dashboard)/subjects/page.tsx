import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { requireUser } from "@/lib/session";
import { getGoalsByUser } from "@/services/goals/goalService";
import { collectProficiencyScores, proficiencyDot } from "@/lib/topic-utils";
import { BookOpen } from "lucide-react";

export default async function SubjectsPage() {
  const user = await requireUser();
  const goals = await getGoalsByUser(user.id);
  const active = goals[0];

  if (!active) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No subjects yet"
        description="Create a goal to generate your syllabus tree of subjects, chapters and topics."
        className="h-[60vh]"
      >
        <Link href="/goals/new" className={cn(buttonVariants())}>
          Create a goal
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description={`Syllabus for ${active.title}. Open a topic to add notes, generate flashcards and practice.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {active.topics.map((subject: any) => {
          const scores = collectProficiencyScores([subject]);
          const avg = scores.length
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;
          return (
            <Card key={subject.id} className="gap-3">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{subject.title}</CardTitle>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {avg}%
                  </span>
                </div>
                <Progress value={avg} className="mt-1 h-1.5" />
              </CardHeader>
              <CardContent className="space-y-3">
                {subject.children.map((chapter: any) => (
                  <div key={chapter.id} className="text-sm">
                    <p className="font-medium">{chapter.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {chapter.children.map((topic: any) => {
                        const s = topic.proficiencyScores?.[0]?.score ?? 0;
                        return (
                          <Link
                            key={topic.id}
                            href={`/topics/${topic.id}`}
                            className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-0.5 text-xs transition-colors hover:bg-muted"
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                proficiencyDot(s)
                              )}
                            />
                            {topic.title}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
