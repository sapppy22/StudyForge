"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GraduationCap, PlayCircle, Loader2, Sparkles, Timer } from "lucide-react";
import type { SimulationMock } from "@/data/simulations/types";
import { EXAM_CATALOG, examLabel } from "@/data/exams/catalog";
import { EXAM_PATTERNS } from "@/data/simulations/patterns";
import { ExamType } from "@prisma/client";

// Driven off the catalog so a newly supported exam shows up here without a
// second edit. CUSTOM has no published pattern to mock, so it is left out.
const MOCKABLE = EXAM_CATALOG.filter((entry) => entry.examType !== ExamType.CUSTOM);
const EXAM_TABS: { label: string; value: ExamType | "ALL" }[] = [
  { label: "All exams", value: "ALL" },
  ...MOCKABLE.map((entry) => ({ label: entry.label, value: entry.examType })),
];

export default function SimulationsPage() {
  const [activeTab, setActiveTab] = useState<ExamType | "ALL">("ALL");
  const queryClient = useQueryClient();

  const { data: simulations = [], isPending: loading } = useQuery<SimulationMock[]>({
    queryKey: ["simulations"],
    queryFn: async () => {
      const res = await fetch("/api/simulations");
      if (!res.ok) throw new Error("Couldn't load the simulation library");
      return res.json();
    },
  });

  const generate = useMutation({
    mutationFn: async (examType: ExamType) => {
      const res = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examType }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not build that paper");
      }
      return res.json() as Promise<SimulationMock>;
    },
    onSuccess: (paper) => {
      void queryClient.invalidateQueries({ queryKey: ["simulations"] });
      toast.success(`${paper.questions.length}-question paper ready.`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filteredSimulations = useMemo(
    () => simulations.filter((s) => (activeTab === "ALL" ? true : s.examType === activeTab)),
    [simulations, activeTab]
  );

  const pattern = activeTab === "ALL" ? null : EXAM_PATTERNS[activeTab];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Real Exam Simulations"
        description="Full-length computer-based mocks built to each board's published pattern — the same question count, marking scheme and clock as the real paper, with proctoring on."
      />

      <div className="flex flex-wrap items-center gap-2 overflow-x-auto border-b border-border pb-3">
        {EXAM_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors",
              activeTab === tab.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {pattern && activeTab !== "ALL" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="space-y-1">
              <p className="font-medium">Build a full-length {examLabel(activeTab)} paper</p>
              <p className="text-sm text-muted-foreground">
                {pattern.totalQuestions} questions across{" "}
                {pattern.sections.length} section
                {pattern.sections.length === 1 ? "" : "s"} · {pattern.totalMarks} marks ·{" "}
                {pattern.durationMinutes} minutes
                {pattern.sectionalTiming ? " · sectional limits" : ""}
              </p>
            </div>
            <Button
              onClick={() => generate.mutate(activeTab)}
              disabled={generate.isPending}
            >
              {generate.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Building {pattern.totalQuestions}{" "}
                  questions…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Generate paper
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSimulations.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No papers for this exam yet"
          description={
            activeTab === "ALL"
              ? "Pick an exam above and generate a full-length paper to get started."
              : "Generate a full-length paper above — it will match the official pattern exactly."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredSimulations.map((sim) => {
            const isGenerated = sim.origin === "generated";
            const official = EXAM_PATTERNS[sim.examType];
            const isFullLength =
              official && sim.questions.length === official.totalQuestions;

            return (
              <Card
                key={sim.id}
                className="border-border flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                        >
                          {examLabel(sim.examType)} CBT
                        </Badge>
                        {isFullLength ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Full length
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Sample ({sim.questions.length} of {official?.totalQuestions})
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base font-bold leading-snug">
                        {sim.title}
                      </CardTitle>
                    </div>
                    {!isGenerated && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {sim.year || 2025} Pattern
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {sim.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Duration</span>
                      <p className="font-bold text-foreground">{sim.durationMinutes} mins</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">
                        Total Marks
                      </span>
                      <p className="font-bold text-emerald-500">{sim.totalMarks}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Questions</span>
                      <p className="font-bold text-foreground">{sim.questions.length}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {sim.sections.map((sec) => (
                      <span
                        key={sec.id}
                        className="rounded bg-muted px-2 py-0.5 text-muted-foreground"
                      >
                        {sec.name} ({sec.totalQuestions}Q
                        {sec.durationMinutes ? ` · ${sec.durationMinutes}m` : ""})
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/simulations/${sim.id}`}
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "w-full bg-emerald-600 font-bold text-zinc-950 hover:bg-emerald-500"
                    )}
                  >
                    <PlayCircle className="mr-1.5 size-4" /> Start Real CBT Simulation
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="flex items-center gap-1.5 border-t pt-4 text-xs text-muted-foreground">
        <Timer className="size-3.5" /> Every paper runs on the clock set in{" "}
        <Link href="/settings" className="underline underline-offset-2">
          Settings → Tests &amp; timing
        </Link>
        .
      </p>
    </div>
  );
}
