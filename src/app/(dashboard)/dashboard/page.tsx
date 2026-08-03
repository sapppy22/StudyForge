import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { AdaptiveTestButton } from "@/components/tests/adaptive-test-button";
import { requireUser } from "@/lib/session";
import { getGoalsByUser } from "@/services/goals/goalService";
import { getFlashcardStats } from "@/services/flashcards/flashcardService";
import { getWeakestTopics } from "@/services/analytics/proficiencyService";
import { collectProficiencyScores, proficiencyDot } from "@/lib/topic-utils";
import {
  BrainCircuit,
  CalendarDays,
  Layers,
  TrendingDown,
  Gauge,
  ChevronRight,
  MessageSquare,
  BookOpen,
} from "lucide-react";

function daysTo(date: Date | null) {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default async function DashboardPage() {
  const user = await requireUser();
  const goals = await getGoalsByUser(user.id);
  const activeGoal = goals[0];

  if (!activeGoal) {
    return (
      <EmptyState
        icon={BrainCircuit}
        title="No goals yet"
        description="Create your first exam goal to generate a syllabus tree and start tracking proficiency."
        className="h-[60vh]"
      >
        <Link className={cn(buttonVariants())} href="/goals/new">
          Create your first goal
        </Link>
      </EmptyState>
    );
  }

  const [flashcards, weakest] = await Promise.all([
    getFlashcardStats(user.id),
    getWeakestTopics(user.id, activeGoal.id, 1),
  ]);

  const scores = collectProficiencyScores(activeGoal.topics);
  const progress = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
  const days = daysTo(activeGoal.examDate);
  const weakestTopic = weakest[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {activeGoal.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your overall preparation at a glance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdaptiveTestButton goalId={activeGoal.id} size="sm" />
          <Link
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            href="/goals/new"
          >
            New goal
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Overall progress"
          value={`${progress}%`}
          icon={Gauge}
          hint={`${scores.length} topic${scores.length === 1 ? "" : "s"} assessed`}
        />
        <StatCard
          label="Days to exam"
          value={days ?? "—"}
          icon={CalendarDays}
          hint={
            activeGoal.examDate
              ? new Date(activeGoal.examDate).toLocaleDateString()
              : "No date set"
          }
        />
        <StatCard
          label="Flashcards due"
          value={flashcards.due}
          icon={Layers}
          hint={`${flashcards.total} card${flashcards.total === 1 ? "" : "s"} total`}
        />
        <StatCard
          label="Weakest topic"
          value={
            weakestTopic ? (
              <span className="line-clamp-1 text-base font-medium">
                {weakestTopic.topic.title}
              </span>
            ) : (
              "—"
            )
          }
          icon={TrendingDown}
          hint={
            weakestTopic
              ? `${Math.round(weakestTopic.score)}% proficiency`
              : "Take a test to see"
          }
        />
      </div>

      {progress > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-2 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall proficiency</span>
              <span className="tabular-nums text-muted-foreground">
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/flashcards"
          className="group flex items-center justify-between rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="size-4.5" />
            </span>
            <div>
              <p className="text-sm font-medium">Review flashcards</p>
              <p className="text-xs text-muted-foreground">
                {flashcards.due} due now
              </p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/subjects"
          className="group flex items-center justify-between rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-4.5" />
            </span>
            <div>
              <p className="text-sm font-medium">Browse subjects</p>
              <p className="text-xs text-muted-foreground">Add notes & study</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/chat"
          className="group flex items-center justify-between rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="size-4.5" />
            </span>
            <div>
              <p className="text-sm font-medium">Ask the tutor</p>
              <p className="text-xs text-muted-foreground">Doubt-solving chat</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Syllabus</CardTitle>
          <CardDescription>
            Your topic tree. Coloured dots show proficiency — open a topic to add
            notes, generate flashcards and practice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {activeGoal.topics.map((subject) => (
            <div key={subject.id}>
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{subject.title}</h3>
                <span className="text-xs text-muted-foreground">
                  {subject.children.length} chapter
                  {subject.children.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-2 space-y-2.5 border-l pl-4">
                {subject.children.map((chapter: any) => (
                  <div key={chapter.id}>
                    <p className="text-sm text-muted-foreground">
                      {chapter.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {chapter.children.map((topic: any) => {
                        const score = topic.proficiencyScores?.[0]?.score ?? 0;
                        return (
                          <Link
                            key={topic.id}
                            href={`/topics/${topic.id}`}
                            className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs transition-colors hover:bg-muted"
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                proficiencyDot(score)
                              )}
                            />
                            {topic.title}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
