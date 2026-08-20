"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  GraduationCap,
  PlayCircle,
  Loader2,
} from "lucide-react";
import type { SimulationMock } from "@/data/simulations/types";
import { EXAM_CATALOG, examLabel } from "@/data/exams/catalog";
import { ExamType } from "@prisma/client";

// Driven off the catalog so a newly supported exam shows up here without a
// second edit. CUSTOM has no published pattern to mock, so it is left out.
const EXAM_TABS: { label: string; value: ExamType | "ALL" }[] = [
  { label: "All exams", value: "ALL" },
  ...EXAM_CATALOG.filter((entry) => entry.examType !== ExamType.CUSTOM).map(
    (entry) => ({ label: entry.label, value: entry.examType })
  ),
];

export default function SimulationsPage() {
  const [simulations, setSimulations] = useState<SimulationMock[]>([]);
  const [activeTab, setActiveTab] = useState<ExamType | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/simulations")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSimulations(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredSimulations = simulations.filter((s) => {
    if (activeTab === "ALL") return true;
    return s.examType === activeTab;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Real Exam Simulations"
        description="Full-length computer-based mocks built to each board's published pattern — the same question count, marking scheme and clock as the real paper, with proctoring on."
      />

      {/* Filter Tabs */}
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

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSimulations.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No simulation mocks available"
          description="Select another exam tab to explore authentic CBT test papers."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredSimulations.map((sim) => (
            <Card key={sim.id} className="border-border flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                      {examLabel(sim.examType)} CBT
                    </Badge>
                    <CardTitle className="text-base font-bold leading-snug">
                      {sim.title}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {sim.year || 2025} Pattern
                  </Badge>
                </div>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {sim.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Duration</span>
                    <p className="font-bold text-foreground">{sim.durationMinutes} mins</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Total Marks</span>
                    <p className="font-bold text-emerald-500">{sim.totalMarks}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Questions</span>
                    <p className="font-bold text-foreground">{sim.questions.length}</p>
                  </div>
                </div>

                {/* Section badges */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {sim.sections.map((sec) => (
                    <span key={sec.id} className="rounded bg-muted px-2 py-0.5 text-muted-foreground">
                      {sec.name} ({sec.totalQuestions}Q)
                    </span>
                  ))}
                </div>

                {/* Start CBT CTA */}
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
          ))}
        </div>
      )}
    </div>
  );
}
