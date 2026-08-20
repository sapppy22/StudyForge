"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ScoreTrendChart } from "@/components/charts/score-trend-chart";
import { ProficiencyBarChart } from "@/components/charts/proficiency-bar-chart";
import {
  Loader2,
  Trophy,
  Target,
  Layers,
  TrendingDown,
  TriangleAlert,
  BarChart3,
} from "lucide-react";

/**
 * The shape `/api/analytics` returns. Every field is a collection the page
 * indexes into, which is why a failed load has to be modelled as its own state
 * rather than as an empty `data` object: a 401, a 503 from an unreachable
 * database or an offline fetch all answer with something that is *not* this,
 * and spreading `undefined` threw during render — taking the whole dashboard
 * segment into its error boundary instead of showing what went wrong.
 */
interface AnalyticsData {
  weakest: any[];
  proficiency: any[];
  testHistory: any[];
  flashcards: { due: number; total: number; reviews: number };
}

const EMPTY_FLASHCARDS = { due: 0, total: 0, reviews: 0 };

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // State is only ever written from a promise callback, so the effect below
  // never sets it synchronously: `loading` starts true and is cleared once the
  // request settles, whichever way it goes.
  const load = useCallback(
    () =>
      fetch("/api/analytics")
        .then(async (res) => {
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.error ?? "Couldn't load your analytics.");
          return body;
        })
        .then((body) => {
          setData({
            weakest: Array.isArray(body.weakest) ? body.weakest : [],
            proficiency: Array.isArray(body.proficiency) ? body.proficiency : [],
            testHistory: Array.isArray(body.testHistory) ? body.testHistory : [],
            flashcards: body.flashcards ?? EMPTY_FLASHCARDS,
          });
          setError(null);
        })
        .catch((err: unknown) => {
          setData(null);
          setError(
            err instanceof Error ? err.message : "Couldn't load your analytics."
          );
        })
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    void load();
  }, [load]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    void load();
  }, [load]);

  const testHistory = useMemo(() => data?.testHistory ?? [], [data]);
  const flashcards = data?.flashcards ?? EMPTY_FLASHCARDS;

  const trend = useMemo(
    () =>
      [...testHistory]
        .reverse()
        .slice(-12)
        .map((a: any) => ({
          label: new Date(a.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          score: a.maxScore > 0 ? ((a.score ?? 0) / a.maxScore) * 100 : 0,
        })),
    [testHistory]
  );

  const proficiencyBars = useMemo(
    () =>
      [...(data?.proficiency ?? [])]
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 10)
        .map((p: any) => ({ topic: p.topic.title, score: p.score })),
    [data]
  );

  const avgScore = useMemo(() => {
    if (testHistory.length === 0) return 0;
    const pcts = testHistory.map((a: any) =>
      a.maxScore > 0 ? ((a.score ?? 0) / a.maxScore) * 100 : 0
    );
    return Math.round(pcts.reduce((x: number, y: number) => x + y, 0) / pcts.length);
  }, [testHistory]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={TriangleAlert}
        title="Analytics couldn't load"
        description={error ?? "Your analytics didn't come back. It's usually temporary."}
        className="h-[60vh]"
      >
        <Button onClick={retry}>Try again</Button>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track your accuracy, proficiency and review activity over time."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tests taken" value={testHistory.length} icon={Trophy} />
        <StatCard label="Average score" value={`${avgScore}%`} icon={Target} />
        <StatCard label="Cards reviewed" value={flashcards.reviews} icon={Layers} />
        <StatCard
          label="Cards due"
          value={flashcards.due}
          icon={Layers}
          hint={`${flashcards.total} total`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Score trend</CardTitle>
            <CardDescription>Your test accuracy over recent attempts.</CardDescription>
          </CardHeader>
          <CardContent>
            {trend.length > 0 ? (
              <ScoreTrendChart data={trend} />
            ) : (
              <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <BarChart3 className="size-8 opacity-40" />
                Take a test to start tracking your score trend.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Proficiency by topic</CardTitle>
            <CardDescription>Top topics by current proficiency.</CardDescription>
          </CardHeader>
          <CardContent>
            {proficiencyBars.length > 0 ? (
              <ProficiencyBarChart data={proficiencyBars} />
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <Target className="size-8 opacity-40" />
                No proficiency data yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="size-5 text-rose-500" /> Weakest topics
          </CardTitle>
          <CardDescription>
            Focus your next study session here — adaptive tests target these first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.weakest.length > 0 ? (
            data.weakest.map((item: any) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.topic.title}</span>
                  <span className="tabular-nums font-medium">
                    {Math.round(item.score)}%
                  </span>
                </div>
                <Progress value={item.score} className="h-2" />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No data yet. Take a test to see weakness analysis.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
