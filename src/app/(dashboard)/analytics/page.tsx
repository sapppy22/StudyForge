"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ScoreTrendChart } from "@/components/charts/score-trend-chart";
import { ProficiencyBarChart } from "@/components/charts/proficiency-bar-chart";
import {
  Loader2,
  Trophy,
  Target,
  Layers,
  TrendingDown,
  BarChart3,
} from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const trend = useMemo(() => {
    if (!data) return [];
    return [...data.testHistory]
      .reverse()
      .slice(-12)
      .map((a: any) => ({
        label: new Date(a.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        score: a.maxScore > 0 ? ((a.score ?? 0) / a.maxScore) * 100 : 0,
      }));
  }, [data]);

  const proficiencyBars = useMemo(() => {
    if (!data) return [];
    return [...data.proficiency]
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10)
      .map((p: any) => ({ topic: p.topic.title, score: p.score }));
  }, [data]);

  const avgScore = useMemo(() => {
    if (!data || data.testHistory.length === 0) return 0;
    const pcts = data.testHistory.map((a: any) =>
      a.maxScore > 0 ? ((a.score ?? 0) / a.maxScore) * 100 : 0
    );
    return Math.round(pcts.reduce((x: number, y: number) => x + y, 0) / pcts.length);
  }, [data]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track your accuracy, proficiency and review activity over time."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tests taken" value={data.testHistory.length} icon={Trophy} />
        <StatCard label="Average score" value={`${avgScore}%`} icon={Target} />
        <StatCard label="Cards reviewed" value={data.flashcards.reviews} icon={Layers} />
        <StatCard
          label="Cards due"
          value={data.flashcards.due}
          icon={Layers}
          hint={`${data.flashcards.total} total`}
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
