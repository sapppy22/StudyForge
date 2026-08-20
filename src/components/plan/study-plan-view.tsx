"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { SuggestedResources } from "./suggested-resources";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Loader2,
  RefreshCw,
  Repeat,
  Sparkles,
  Target,
} from "lucide-react";

interface PlanTask {
  id: string;
  title: string;
  description: string | null;
  kind: "learn" | "practice" | "revise" | "test";
  minutes: number;
  scheduledFor: string;
  priority: number;
  completed: boolean;
  topic: { id: string; title: string } | null;
}

interface Plan {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  dailyMinutes: number;
  rationale: string | null;
  generatedBy: string;
  version: number;
  tasks: PlanTask[];
}

interface Goal {
  id: string;
  title: string;
}

const KIND_META: Record<
  PlanTask["kind"],
  { label: string; icon: typeof BookOpen; className: string }
> = {
  learn: { label: "Learn", icon: BookOpen, className: "text-chart-2" },
  practice: { label: "Practice", icon: Target, className: "text-chart-1" },
  revise: { label: "Revise", icon: Repeat, className: "text-chart-5" },
  test: { label: "Test", icon: GraduationCap, className: "text-chart-3" },
};

function formatDay(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const isToday =
    date.getUTCFullYear() === today.getUTCFullYear() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCDate() === today.getUTCDate();

  const label = date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return isToday ? `Today · ${label}` : label;
}

export function StudyPlanView({ goals }: { goals: Goal[] }) {
  const [goalId, setGoalId] = useState(goals[0]?.id ?? "");
  const queryClient = useQueryClient();
  const queryKey = ["study-plan", goalId];

  const { data: plan, isPending } = useQuery<Plan | null>({
    queryKey,
    enabled: Boolean(goalId),
    queryFn: async () => {
      const res = await fetch(`/api/study-plan?goalId=${goalId}`);
      if (!res.ok) throw new Error("Failed to load the plan");
      return res.json();
    },
  });

  const generate = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not build a plan");
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      toast.success("Study plan generated.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const res = await fetch(`/api/study-plan/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error("Could not save that");
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Plan | null>(queryKey);
      queryClient.setQueryData<Plan | null>(queryKey, (current) =>
        current
          ? {
              ...current,
              tasks: current.tasks.map((t) =>
                t.id === id ? { ...t, completed } : t
              ),
            }
          : current
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      // Roll the tick back rather than leaving the UI lying about saved state.
      queryClient.setQueryData(queryKey, context?.previous);
      toast.error("Couldn't save that. Try again.");
    },
  });

  const days = useMemo(() => {
    const grouped = new Map<string, PlanTask[]>();
    for (const task of plan?.tasks ?? []) {
      const key = task.scheduledFor;
      grouped.set(key, [...(grouped.get(key) ?? []), task]);
    }
    return Array.from(grouped, ([date, tasks]) => ({ date, tasks }));
  }, [plan]);

  const totals = useMemo(() => {
    const tasks = plan?.tasks ?? [];
    const done = tasks.filter((t) => t.completed).length;
    return {
      done,
      total: tasks.length,
      pct: tasks.length ? (done / tasks.length) * 100 : 0,
      minutes: tasks.reduce((sum, t) => sum + t.minutes, 0),
    };
  }, [plan]);

  if (goals.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No goals yet"
        description="Create a goal with a syllabus first — the plan is built from its topics."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={goalId} onValueChange={(v) => setGoalId(v ?? goalId)}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {goals.map((goal) => (
              <SelectItem key={goal.id} value={goal.id}>
                {goal.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={() => generate.mutate()}
          disabled={generate.isPending || !goalId}
          className="ml-auto"
        >
          {generate.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : plan ? (
            <RefreshCw className="size-4" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {plan ? "Rebuild plan" : "Generate plan"}
        </Button>
      </div>

      {isPending ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !plan ? (
        <EmptyState
          icon={CalendarDays}
          title="No study plan yet"
          description="Generate one to get a day-by-day schedule weighted towards your weakest topics."
        />
      ) : (
        <>
          <Card>
            <CardContent className="space-y-3 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{plan.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {plan.dailyMinutes} min/day · {totals.total} blocks ·{" "}
                    {Math.round(totals.minutes / 60)}h total
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {plan.version > 1 && (
                    <Badge
                      variant="secondary"
                      title="The plan re-prioritised itself after your test results"
                    >
                      Adapted ×{plan.version - 1}
                    </Badge>
                  )}
                  {plan.generatedBy === "offline" && (
                    <Badge variant="outline">Offline</Badge>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="tabular-nums">
                    {totals.done}/{totals.total}
                  </span>
                </div>
                <Progress value={totals.pct} className="h-2" />
              </div>

              {plan.rationale && (
                <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                  {plan.rationale}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {days.map(({ date, tasks }) => {
              const dayMinutes = tasks.reduce((s, t) => s + t.minutes, 0);
              return (
                <div key={date} className="space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-semibold">{formatDay(date)}</h3>
                    <span className="text-xs text-muted-foreground">
                      {dayMinutes} min
                    </span>
                  </div>

                  {tasks.map((task) => {
                    const meta = KIND_META[task.kind];
                    const Icon = meta.icon;
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                          task.completed
                            ? "border-primary/30 bg-primary/5"
                            : "bg-card"
                        )}
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={(checked) =>
                            toggle.mutate({
                              id: task.id,
                              completed: Boolean(checked),
                            })
                          }
                          aria-label={`Mark "${task.title}" ${task.completed ? "incomplete" : "complete"}`}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Icon className={cn("size-3.5 shrink-0", meta.className)} />
                            <span
                              className={cn(
                                "text-sm font-medium",
                                task.completed && "text-muted-foreground line-through"
                              )}
                            >
                              {task.title}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                              {meta.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {task.minutes} min
                            </span>
                          </div>
                          {task.description && (
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {task.description}
                            </p>
                          )}
                          {task.topic && (
                            <SuggestedResources
                              topicId={task.topic.id}
                              intent={task.kind}
                              className="mt-2"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
