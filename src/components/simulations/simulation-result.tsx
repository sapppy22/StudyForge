"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MathText } from "@/components/shared/math-text";
import type { SimulationAttemptResult } from "@/data/simulations/types";
import {
  CheckCircle2,
  XCircle,
  CircleDashed,
  Mail,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";

interface SimulationResultProps {
  result: SimulationAttemptResult;
  onRetake?: () => void;
}

export function SimulationResult({ result, onRetake }: SimulationResultProps) {
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect" | "unattempted">("all");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const isClean = result.proctoringViolations.length === 0;

  const filteredQuestions = result.questionResults.filter((q) => {
    if (filter === "correct") return q.isCorrect;
    if (filter === "incorrect") return !q.isCorrect && q.userResponse?.trim();
    if (filter === "unattempted") return !q.userResponse?.trim();
    return true;
  });

  const sendEmailReport = async () => {
    setSendingEmail(true);
    try {
      const res = await fetch("/api/email/performance-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: result.attemptId,
          proctoringViolationsCount: result.proctoringViolations.length,
        }),
      });
      if (res.ok) {
        setEmailSent(true);
      }
    } catch {
      // ignore
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      {/* Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/simulations"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to All Simulations
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={sendEmailReport}
            disabled={sendingEmail || emailSent}
            className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs"
          >
            {sendingEmail ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : emailSent ? (
              <Check className="mr-1.5 size-3.5 text-emerald-500" />
            ) : (
              <Mail className="mr-1.5 size-3.5" />
            )}
            {emailSent ? "Scorecard Emailed!" : "Email Me Scorecard"}
          </Button>

          {onRetake && (
            <Button size="sm" onClick={onRetake} variant="secondary" className="text-xs">
              <RotateCcw className="mr-1.5 size-3.5" /> Retake Test
            </Button>
          )}
        </div>
      </div>

      {/* Main Score & Performance Banner */}
      <Card className="border-emerald-500/20 bg-gradient-to-b from-card to-emerald-950/10">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center space-y-3">
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
              <Trophy className="mr-1 size-3.5" /> Exam Simulation Scorecard
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{result.title}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Official CBT Grading with Negative Marking Applied
            </p>

            <div className="py-4">
              <div className="text-5xl sm:text-6xl font-extrabold tabular-nums text-emerald-500">
                {result.totalScore}{" "}
                <span className="text-2xl sm:text-3xl font-normal text-muted-foreground">
                  / {result.maxScore}
                </span>
              </div>
              <div className="mt-2 text-sm font-semibold text-muted-foreground">
                {result.percentage}% Overall Score
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border">
              <div className="rounded-lg bg-muted/40 p-3">
                <span className="text-xs text-muted-foreground uppercase">Est. Percentile</span>
                <p className="text-lg font-bold text-emerald-500">{result.percentile} %ile</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <span className="text-xs text-muted-foreground uppercase">Accuracy</span>
                <p className="text-lg font-bold text-foreground">{result.accuracy}%</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <span className="text-xs text-muted-foreground uppercase">Time Spent</span>
                <p className="text-lg font-bold text-foreground">
                  {Math.max(1, Math.round(result.timeSpentSec / 60))} mins
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <span className="text-xs text-muted-foreground uppercase">Attempt Ratio</span>
                <p className="text-lg font-bold text-foreground">
                  {result.answeredCount} / {result.totalQuestions}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proctoring & Integrity Audit Banner */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border p-4 text-sm",
          isClean
            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
            : "border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400"
        )}
      >
        {isClean ? (
          <ShieldCheck className="size-6 shrink-0" />
        ) : (
          <ShieldAlert className="size-6 shrink-0" />
        )}
        <div>
          <p className="font-semibold">
            {isClean
              ? "🛡️ 100% Clean Proctoring Audit"
              : `⚠️ ${result.proctoringViolations.length} Proctoring Infraction(s) Logged`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isClean
              ? "This exam session was executed strictly within full-screen without unauthorized window defocusing or app switching."
              : "App-switching or tab navigation events were detected during the examination session and logged in your report."}
          </p>
        </div>
      </div>

      {/* Section-Wise Breakdown Cards */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold tracking-tight">Section-wise Performance</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {result.sectionScores.map((sec) => (
            <Card key={sec.sectionId} className="bg-card">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{sec.sectionName}</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {sec.score} / {sec.maxScore}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Accuracy: {sec.accuracy}%</span>
                  <span>{sec.correct} Correct · {sec.incorrect} Wrong</span>
                </div>
                <Progress value={Math.max(0, (sec.score / sec.maxScore) * 100)} className="h-1.5" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Question Review Section with Filter Tabs */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Question & Solution Review</h3>
            <p className="text-xs text-muted-foreground">
              Examine detailed step-by-step solutions, key concepts, and marking scheme.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/30 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "rounded px-2.5 py-1 font-medium transition-colors",
                filter === "all" ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"
              )}
            >
              All ({result.questionResults.length})
            </button>
            <button
              onClick={() => setFilter("correct")}
              className={cn(
                "rounded px-2.5 py-1 font-medium transition-colors",
                filter === "correct" ? "bg-emerald-600 text-white font-semibold" : "hover:bg-muted"
              )}
            >
              Correct ({result.correctCount})
            </button>
            <button
              onClick={() => setFilter("incorrect")}
              className={cn(
                "rounded px-2.5 py-1 font-medium transition-colors",
                filter === "incorrect" ? "bg-rose-600 text-white font-semibold" : "hover:bg-muted"
              )}
            >
              Wrong ({result.incorrectCount})
            </button>
            <button
              onClick={() => setFilter("unattempted")}
              className={cn(
                "rounded px-2.5 py-1 font-medium transition-colors",
                filter === "unattempted" ? "bg-zinc-700 text-white font-semibold" : "hover:bg-muted"
              )}
            >
              Unanswered ({result.unansweredCount})
            </button>
          </div>
        </div>

        {/* Question Cards List */}
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const hasAnswer = Boolean(q.userResponse?.trim());
            return (
              <Card key={q.questionId} className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {q.isCorrect ? (
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                      ) : hasAnswer ? (
                        <XCircle className="mt-0.5 size-5 shrink-0 text-rose-500" />
                      ) : (
                        <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm">Question {idx + 1}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {q.subject} · {q.chapter}
                          </Badge>
                        </div>
                        <p className="text-sm font-normal leading-relaxed">
                          <MathText>{q.content}</MathText>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={cn(
                          "text-sm font-bold font-mono",
                          q.score > 0
                            ? "text-emerald-500"
                            : q.score < 0
                            ? "text-rose-500"
                            : "text-muted-foreground"
                        )}
                      >
                        {q.score > 0 ? `+${q.score}` : q.score} / {q.maxScore}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-xs sm:text-sm">
                  <div className="grid sm:grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3">
                    <div>
                      <span className="text-muted-foreground">Your Response: </span>
                      <span className="font-semibold text-foreground">
                        {q.userResponse ? (
                          <MathText>{q.userResponse}</MathText>
                        ) : (
                          <span className="italic text-muted-foreground">Not Attempted</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Correct Answer: </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        <MathText>{q.correctAnswer}</MathText>
                      </span>
                    </div>
                  </div>

                  {q.solution && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-1 text-zinc-800 dark:text-zinc-200">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="size-3.5" /> Worked Solution & Step-by-Step Approach
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                        <MathText>{q.solution}</MathText>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
