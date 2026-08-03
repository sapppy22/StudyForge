"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AdaptiveTestButton } from "@/components/tests/adaptive-test-button";
import { Loader2, GraduationCap, CheckCircle2, PlayCircle } from "lucide-react";

interface TestRow {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  _count: { questions: number };
  attempts: {
    id: string;
    score: number | null;
    maxScore: number;
    createdAt: string;
  }[];
}

const statusLabel: Record<string, string> = {
  scheduled: "Scheduled",
  ready: "Ready",
  in_progress: "In progress",
  completed: "Completed",
};

export default function TestsPage() {
  const [tests, setTests] = useState<TestRow[]>([]);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/tests").then((r) => r.json()),
      fetch("/api/goals").then((r) => r.json()),
    ])
      .then(([t, g]) => {
        setTests(Array.isArray(t) ? t : []);
        setGoalId(Array.isArray(g) && g[0] ? g[0].id : null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tests"
        description="Practice tests and mock exams. Adaptive tests target your weakest topics."
      >
        {goalId && <AdaptiveTestButton goalId={goalId} size="sm" />}
      </PageHeader>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : tests.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No tests yet"
          description="Generate an adaptive test above, or create one from any topic page."
        >
          <Link href="/subjects" className={cn(buttonVariants({ variant: "outline" }))}>
            Browse topics
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {tests.map((t) => {
            const attempt = t.attempts[0];
            const completed = t.status === "completed" && attempt;
            const pct =
              attempt && attempt.maxScore > 0
                ? Math.round(((attempt.score ?? 0) / attempt.maxScore) * 100)
                : null;
            return (
              <Card key={t.id} className="gap-0 py-0">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-9 items-center justify-center rounded-lg",
                        completed
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {completed ? (
                        <CheckCircle2 className="size-4.5" />
                      ) : (
                        <PlayCircle className="size-4.5" />
                      )}
                    </span>
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t._count.questions} question
                        {t._count.questions === 1 ? "" : "s"} ·{" "}
                        {statusLabel[t.status] ?? t.status}
                        {pct !== null && ` · scored ${pct}%`}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/tests/${t.id}`}
                    className={cn(
                      buttonVariants({
                        variant: completed ? "outline" : "default",
                        size: "sm",
                      })
                    )}
                  >
                    {completed ? "Review" : "Start test"}
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
