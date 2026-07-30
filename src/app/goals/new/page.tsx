"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listTemplates } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { BrainCircuit, Calendar, Clock, Loader2 } from "lucide-react";

const templates = listTemplates();

export default function NewGoalPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [examDate, setExamDate] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState<number>(60);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setPending(true);
    setError(null);

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
      const data = await res.json();
      setError(data.error ?? "Failed to create goal");
      setPending(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Set up your goal</CardTitle>
          <CardDescription>
            Pick an exam and schedule. We&apos;ll build your syllabus tree automatically.
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
                      "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-[#F7F7F5]",
                      selected === t.key && "border-indigo-600 bg-indigo-50/50"
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F7F7F5]">
                      <BrainCircuit className="h-5 w-5" />
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
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
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
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dailyMinutes"
                    type="number"
                    className="pl-9"
                    value={dailyMinutes}
                    onChange={(e) => setDailyMinutes(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" disabled={!selected || pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create goal
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
