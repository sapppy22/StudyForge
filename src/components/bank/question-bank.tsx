"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { QuestionRow } from "./question-row";
import { formatDuration, useSolveTimer } from "./use-solve-timer";
import type { BankProgressRow, BankResponse, BankRow } from "./types";
import { ListChecks, Loader2, Search } from "lucide-react";

const STATUSES = [
  { value: "all", label: "All" },
  { value: "unsolved", label: "Unsolved" },
  { value: "solved", label: "Solved" },
  { value: "bookmarked", label: "Bookmarked" },
];

/**
 * Objective questions are answered by picking an option; subjective ones are
 * worked on paper. Students sit down to do one or the other, so it is a filter
 * rather than a mixed list.
 */
const KINDS = [
  { value: "all", label: "Everything" },
  { value: "objective", label: "Objective" },
  { value: "subjective", label: "Written" },
];

const ANY = "__any__";

export function QuestionBank({
  exams,
  defaultExam,
  sources,
}: {
  exams: { value: string; label: string }[];
  defaultExam: string;
  sources: { label: string; url: string }[];
}) {
  const [examType, setExamType] = useState(defaultExam);
  const [subject, setSubject] = useState(ANY);
  const [difficulty, setDifficulty] = useState(ANY);
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const timer = useSolveTimer();
  const queryClient = useQueryClient();

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const queryKey = useMemo(
    () => ["bank", examType, subject, difficulty, status, kind, debouncedSearch],
    [examType, subject, difficulty, status, kind, debouncedSearch]
  );

  const { data, isPending, isFetching } = useQuery<BankResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ examType, status, kind });
      if (subject !== ANY) params.set("subject", subject);
      if (difficulty !== ANY) params.set("difficulty", difficulty);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/bank?${params}`);
      if (!res.ok) throw new Error("Failed to load the question bank");
      return res.json();
    },
    // Filter changes swap the key; keeping the previous rows on screen while the
    // new set loads avoids the list collapsing to a spinner on every keystroke.
    placeholderData: (previous) => previous,
  });

  // Switching exams invalidates the subject filter, which is exam-specific.
  function changeExam(next: string) {
    setExamType(next);
    setSubject(ANY);
  }

  const patch = useCallback(
    async (questionId: string, body: Record<string, unknown>) => {
      const res = await fetch(`/api/bank/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    []
  );

  /** Applies a local change to one question so the tick feels instant. */
  const patchLocal = useCallback(
    (questionId: string, update: Partial<BankProgressRow>) => {
      queryClient.setQueryData<BankResponse>(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          questions: current.questions.map((q) => {
            if (q.id !== questionId) return q;
            // A question the user has never touched has no progress row yet.
            const base: BankProgressRow = q.progress[0] ?? {
              solved: false,
              bookmarked: false,
              attempts: 0,
              timeSpentSec: 0,
              bestTimeSec: null,
              notes: null,
            };
            return { ...q, progress: [{ ...base, ...update }] };
          }),
        };
      });
    },
    [queryClient, queryKey]
  );

  async function toggleSolved(question: BankRow, solved: boolean) {
    // Banking the running clock is the whole point of the timer, so stop it and
    // send the elapsed time along with the tick.
    const elapsedSec = timer.stop(question.id);
    const previous = question.progress[0];

    patchLocal(question.id, {
      solved,
      bestTimeSec:
        solved && elapsedSec > 0
          ? Math.min(previous?.bestTimeSec ?? Number.MAX_SAFE_INTEGER, elapsedSec)
          : (previous?.bestTimeSec ?? null),
    });

    try {
      await patch(question.id, { solved, elapsedSec });
      // Refetch so the header counts and per-subject totals stay in step.
      void queryClient.invalidateQueries({ queryKey: ["bank"] });
    } catch {
      patchLocal(question.id, { solved: !solved });
      toast.error("Couldn't save that. Try again.");
    }
  }

  async function toggleBookmark(question: BankRow, bookmarked: boolean) {
    patchLocal(question.id, { bookmarked });
    try {
      await patch(question.id, { bookmarked });
    } catch {
      patchLocal(question.id, { bookmarked: !bookmarked });
      toast.error("Couldn't save that. Try again.");
    }
  }

  function startTimer(question: BankRow) {
    const displaced = timer.start(question.id);
    // Don't lose the time already spent on whatever question we moved off.
    if (displaced && displaced.seconds > 0) {
      void patch(displaced.questionId, { elapsedSec: displaced.seconds }).catch(
        () => undefined
      );
    }
  }

  function stopTimer(question: BankRow) {
    const seconds = timer.stop(question.id);
    if (seconds > 0) {
      void patch(question.id, { elapsedSec: seconds }).catch(() => undefined);
    }
  }

  const stats = data?.stats;
  const pct = stats && stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;

  // Group into subject → chapter sections so the sheet reads like a syllabus
  // rather than a flat list.
  const grouped = useMemo(() => {
    const sections = new Map<string, Map<string, BankRow[]>>();
    for (const q of data?.questions ?? []) {
      const chapters = sections.get(q.subject) ?? new Map<string, BankRow[]>();
      const rows = chapters.get(q.chapter) ?? [];
      rows.push(q);
      chapters.set(q.chapter, rows);
      sections.set(q.subject, chapters);
    }
    return Array.from(sections, ([subjectName, chapters]) => ({
      subject: subjectName,
      chapters: Array.from(chapters, ([chapter, rows]) => ({ chapter, rows })),
    }));
  }, [data]);

  const subjects = data?.taxonomy.map((t) => t.subject) ?? [];

  return (
    <div className="space-y-5">
      <Tabs value={examType} onValueChange={(v) => changeExam(v ?? defaultExam)}>
        <TabsList className="flex-wrap">
          {exams.map((exam) => (
            <TabsTrigger key={exam.value} value={exam.value}>
              {exam.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {stats && (
        <Card>
          <CardContent className="space-y-4 py-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {stats.solved}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / {stats.total} solved
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(stats.totalTimeSec)} of solving time logged
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {stats.byKind.objective} objective · {stats.byKind.subjective} written
                </Badge>
                {(["easy", "medium", "hard"] as const).map((level) => (
                  <Badge key={level} variant="secondary" className="capitalize">
                    {level} {stats.byDifficulty[level]}/
                    {stats.totalByDifficulty[level]}
                  </Badge>
                ))}
              </div>
            </div>

            <Progress value={pct} className="h-2" />

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {stats.bySubject.map((s) => (
                <span key={s.subject}>
                  {s.subject}{" "}
                  <span className="tabular-nums text-foreground">
                    {s.solved}/{s.total}
                  </span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions, chapters, tags…"
            className="pl-8"
          />
        </div>

        <Select value={subject} onValueChange={(v) => setSubject(v ?? ANY)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={difficulty} onValueChange={(v) => setDifficulty(v ?? ANY)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any difficulty</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex rounded-lg border p-0.5">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                kind === k.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border p-0.5">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                status === s.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Nothing matches those filters"
          description="Try clearing the search box or switching the status filter back to All."
        />
      ) : (
        <div className={cn("space-y-8", isFetching && "opacity-60")}>
          {grouped.map((section) => (
            <section key={section.subject} className="space-y-4">
              <h2 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
                {section.subject}
              </h2>
              {section.chapters.map((chapter) => (
                <div key={chapter.chapter} className="space-y-1.5">
                  <h3 className="text-sm font-medium">{chapter.chapter}</h3>
                  {chapter.rows.map((question, index) => (
                    <QuestionRow
                      key={question.id}
                      question={question}
                      index={index}
                      timing={
                        timer.activeQuestionId === question.id
                          ? timer.elapsed
                          : null
                      }
                      onToggleSolved={(solved) => void toggleSolved(question, solved)}
                      onToggleBookmark={(b) => void toggleBookmark(question, b)}
                      onStartTimer={() => startTimer(question)}
                      onStopTimer={() => stopTimer(question)}
                    />
                  ))}
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      {sources.length > 0 && (
        <footer className="border-t pt-4 text-xs text-muted-foreground">
          <p className="mb-1.5">
            Chapters are ordered by exam weightage. Pattern and weightage
            references:
          </p>
          <ul className="space-y-0.5">
            {sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </footer>
      )}
    </div>
  );
}
