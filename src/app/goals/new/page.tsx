"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listTemplates } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { BrainCircuit, Calendar, Clock, Loader2, ArrowLeft } from "lucide-react";

const templates = listTemplates();

export default function NewGoalPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [examDate, setExamDate] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState<number>(60);
  const [pending, setPending] = useState(false);

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
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
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
            automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label>What are you preparing for?</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {templates.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelected(t.key)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted",
                      selected === t.key &&
                        "border-primary bg-primary/5 ring-1 ring-primary"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-lg",
                        selected === t.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <BrainCircuit className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.examType}</p>
                    </div>
                  </button>
                ))}
              </div>
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
