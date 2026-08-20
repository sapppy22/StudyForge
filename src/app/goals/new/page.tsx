"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listTemplates } from "@/lib/templates";
import { EXAM_CATEGORY_LABELS, type ExamCategory } from "@/data/exams/catalog";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Loader2, ArrowLeft, Search, Check } from "lucide-react";

const templates = listTemplates();

/** Catalog order, deduplicated — the picker groups by these. */
const categories = templates.reduce<ExamCategory[]>((acc, t) => {
  const category = t.category as ExamCategory;
  if (!acc.includes(category)) acc.push(category);
  return acc;
}, []);

export default function NewGoalPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState<number>(60);
  const [pending, setPending] = useState(false);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? templates.filter(
          (t) =>
            t.label.toLowerCase().includes(needle) ||
            t.title.toLowerCase().includes(needle) ||
            t.blurb.toLowerCase().includes(needle)
        )
      : templates;

    return categories
      .map((category) => ({
        category,
        label: EXAM_CATEGORY_LABELS[category],
        exams: matches.filter((t) => t.category === category),
      }))
      .filter((group) => group.exams.length > 0);
  }, [query]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setPending(true);

    const template = templates.find((t) => t.key === selected);
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: template?.title ?? "Custom Goal",
        examType: selected,
        examDate: examDate || undefined,
        dailyStudyMinutes: dailyMinutes,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Failed to create goal");
      setPending(false);
      return;
    }

    toast.success("Goal created — your syllabus is ready");
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Set up your goal</CardTitle>
          <CardDescription>
            Pick an exam and schedule — we&apos;ll build your syllabus tree
            automatically and shape every mock to that exam&apos;s real paper.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>What are you preparing for?</Label>
                <div className="relative w-56">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search exams…"
                    className="pl-8"
                    aria-label="Search exams"
                  />
                </div>
              </div>

              {groups.length === 0 ? (
                <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                  No exam matches “{query}”.
                </p>
              ) : (
                <div className="space-y-5">
                  {groups.map((group) => (
                    <div key={group.category} className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {group.label}
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {group.exams.map((t) => {
                          const isSelected = selected === t.key;
                          return (
                            <button
                              key={t.key}
                              type="button"
                              onClick={() => setSelected(t.key)}
                              aria-pressed={isSelected}
                              className={cn(
                                "rounded-lg border p-3 text-left transition-colors hover:bg-muted",
                                isSelected && "border-primary bg-primary/5 ring-1 ring-primary"
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium">{t.label}</p>
                                {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">{t.blurb}</p>
                              {t.topicCount > 0 && (
                                <p className="mt-1 text-[11px] text-muted-foreground/80">
                                  {t.topicCount} topics ready to schedule
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="examDate">Exam date</Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="examDate"
                    type="date"
                    className="pl-9"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyMinutes">Daily study minutes</Label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="dailyMinutes"
                    type="number"
                    min={10}
                    className="pl-9"
                    value={dailyMinutes}
                    onChange={(e) => setDailyMinutes(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!selected || pending}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Create goal
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
