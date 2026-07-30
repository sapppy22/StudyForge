"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingDown, Trophy } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Tests taken</CardDescription>
            <CardTitle className="text-3xl">{data.testHistory.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" /> Weakest topics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.weakest.map((item: any) => (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{item.topic.title}</span>
                <span className="font-medium">{Math.round(item.score)}%</span>
              </div>
              <Progress value={item.score} className="h-2" />
            </div>
          ))}
          {data.weakest.length === 0 && (
            <p className="text-sm text-muted-foreground">No data yet. Take a test to see weakness analysis.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Test history</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.testHistory.map((attempt: any) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between rounded-lg border bg-white p-3"
              >
                <div>
                  <p className="font-medium">{attempt.test.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(attempt.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-sm font-medium">
                  {attempt.score ?? "—"} / {attempt.maxScore}
                </div>
              </div>
            ))}
            {data.testHistory.length === 0 && (
              <p className="text-sm text-muted-foreground">No tests taken yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
