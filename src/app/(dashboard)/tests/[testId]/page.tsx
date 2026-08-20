"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MathText } from "@/components/shared/math-text";
import {
  claimExamStart,
  clearExamStart,
  formatClock,
  useExamClock,
} from "@/components/exam/use-exam-clock";
import {
  DEFAULT_PREFERENCES,
  resolveQuizDuration,
  type TestPreferences,
} from "@/lib/test-timing";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  CircleDashed,
  Mail,
  Check,
  ShieldCheck,
  Clock,
  EyeOff,
  Play,
} from "lucide-react";
import { ProctoringGuard } from "@/components/simulations/proctoring-guard";
import type { ProctoringViolation } from "@/data/simulations/types";

interface QuizQuestion {
  id: string;
  type: string;
  difficulty: string;
  content: string;
  options?: { label: string; text: string }[] | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  source?: string;
  metadata?: { year?: number | null; sourceName?: string | null } | null;
}

interface GradedAnswer {
  id: string;
  response: string;
  isCorrect: boolean | null;
  score: number;
  maxScore: number;
  feedback: string | null;
  question: QuizQuestion;
}

interface GradedAttempt {
  id: string;
  score: number | null;
  maxScore: number;
  answers: GradedAnswer[];
}

const SOURCE_LABEL: Record<string, string> = {
  web_sourced_pyq: "Past paper",
  user_notes_grounded: "From your notes",
  llm_generated: "Generated",
  user_created: "Yours",
};

export default function TestPage() {
  const { testId } = useParams() as { testId: string };
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GradedAttempt | null>(null);
  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const { data, isPending: loading } = useQuery({
    queryKey: ["test", testId],
    queryFn: async () => {
      const [test, preferences] = await Promise.all([
        fetch(`/api/tests/${testId}`).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/settings").then((r) => (r.ok ? r.json() : DEFAULT_PREFERENCES)),
      ]);

      // A completed test opens straight onto its scorecard.
      let attempt: GradedAttempt | null = null;
      if (test?.status === "completed" && test.attempts?.[0]) {
        attempt = await fetch(`/api/attempts/${test.attempts[0].id}`).then((r) =>
          r.ok ? r.json() : null
        );
      }
      return { test, preferences: preferences as TestPreferences, attempt };
    },
  });

  const test = data?.test;
  const preferences = data?.preferences ?? DEFAULT_PREFERENCES;
  const completedAttempt = data?.attempt;
  const shown = result ?? completedAttempt;

  const questions: { question: QuizQuestion }[] = useMemo(
    () => test?.questions ?? [],
    [test]
  );

  const quizMinutes = useMemo(
    () => (questions.length ? resolveQuizDuration(preferences, questions.length) : null),
    [preferences, questions.length]
  );
  const clockKey = `quiz:${testId}:${quizMinutes ?? 0}`;

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v.trim().length > 0).length,
    [answers]
  );

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tests/${testId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, response]) => ({
            questionId,
            response,
          })),
          proctoringViolations: violations,
        }),
      });
      const body = await res.json();
      const attempt = await fetch(`/api/attempts/${body.attemptId}`).then((r) =>
        r.ok ? r.json() : null
      );
      clearExamStart(clockKey);
      setResult(attempt);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }, [testId, answers, violations, clockKey]);

  const onExpire = useCallback(() => {
    if (preferences.autoSubmitOnTimeUp) void submit();
  }, [preferences.autoSubmitOnTimeUp, submit]);

  const clock = useExamClock({
    durationSec: (quizMinutes ?? 0) * 60,
    startedAt: quizMinutes === null ? null : startedAt,
    onExpire,
  });

  async function sendScorecardEmail() {
    if (!shown?.id) return;
    setSendingEmail(true);
    try {
      const res = await fetch("/api/email/performance-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: shown.id,
          proctoringViolationsCount: violations.length,
        }),
      });
      if (res.ok) setEmailSent(true);
    } catch {
      // A failed send is not worth blocking the scorecard for.
    } finally {
      setSendingEmail(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!test || test.error) {
    return (
      <div className="py-16 text-center text-muted-foreground">Test not found.</div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*  Results                                                                */
  /* ---------------------------------------------------------------------- */

  if (shown) {
    const pct =
      shown.maxScore > 0 ? Math.round(((shown.score ?? 0) / shown.maxScore) * 100) : 0;
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex items-center justify-between">
          <Link
            href="/tests"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> All tests
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={sendScorecardEmail}
            disabled={sendingEmail || emailSent}
            className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs"
          >
            {sendingEmail ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : emailSent ? (
              <Check className="mr-1.5 size-3.5 text-emerald-500" />
            ) : (
              <Mail className="mr-1.5 size-3.5" />
            )}
            {emailSent ? "Report Emailed!" : "Email Me Scorecard"}
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">{test.title}</p>
            <div className="text-4xl font-semibold tabular-nums">
              {shown.score} / {shown.maxScore}
            </div>
            <div className="w-full max-w-xs">
              <Progress value={pct} className="h-2.5" />
            </div>
            <p className="text-sm text-muted-foreground">{pct}% correct</p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {shown.answers.map((a, i) => {
            const q = a.question;
            const correct = a.isCorrect === true;
            const wrong = a.isCorrect === false;
            return (
              <Card key={a.id}>
                <CardHeader>
                  <div className="flex items-start gap-2">
                    {correct ? (
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                    ) : wrong ? (
                      <XCircle className="mt-0.5 size-5 shrink-0 text-rose-500" />
                    ) : (
                      <CircleDashed className="mt-0.5 size-5 shrink-0 text-amber-500" />
                    )}
                    <CardTitle className="text-base font-medium leading-snug">
                      {i + 1}. <MathText>{q.content}</MathText>
                    </CardTitle>
                    <span className="ml-auto shrink-0 text-sm tabular-nums text-muted-foreground">
                      {a.score}/{a.maxScore}
                    </span>
                  </div>
                  {q.source && (
                    <div className="flex flex-wrap items-center gap-1.5 pl-7">
                      <Badge variant="secondary" className="text-[10px]">
                        {SOURCE_LABEL[q.source] ?? q.source}
                        {q.metadata?.year ? ` · ${q.metadata.year}` : ""}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {q.type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Your answer: </span>
                    {a.response ? (
                      <MathText>{a.response}</MathText>
                    ) : (
                      <span className="italic">(blank)</span>
                    )}
                  </p>
                  {q.correctAnswer && !correct && (
                    <p>
                      <span className="text-muted-foreground">Correct: </span>
                      <MathText>{q.correctAnswer}</MathText>
                    </p>
                  )}
                  {a.feedback && (
                    <p className="rounded-md bg-muted px-3 py-2 text-muted-foreground">
                      <MathText>{a.feedback}</MathText>
                    </p>
                  )}
                  {q.explanation && (
                    <p className="whitespace-pre-line text-muted-foreground">
                      <span className="font-medium text-foreground">Explanation: </span>
                      <MathText>{q.explanation}</MathText>
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center gap-2 pb-4">
          <Link href="/tests" className={cn(buttonVariants({ variant: "outline" }))}>
            All tests
          </Link>
          <Link href="/analytics" className={cn(buttonVariants())}>
            View analytics
          </Link>
        </div>
      </div>
    );
  }

  const total = questions.length;

  /* ---------------------------------------------------------------------- */
  /*  Timed-quiz brief                                                       */
  /* ---------------------------------------------------------------------- */

  if (quizMinutes !== null && startedAt === null) {
    return (
      <div className="mx-auto max-w-lg space-y-5 py-8">
        <Link
          href="/tests"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All tests
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>{test.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-center">
              <div>
                <span className="text-xs uppercase text-muted-foreground">Questions</span>
                <p className="text-lg font-semibold tabular-nums">{total}</p>
              </div>
              <div>
                <span className="text-xs uppercase text-muted-foreground">Time</span>
                <p className="text-lg font-semibold tabular-nums">{quizMinutes} min</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {preferences.autoSubmitOnTimeUp
                ? "The quiz submits itself when the clock reaches zero, the way the real thing does."
                : "You'll be warned at zero but can keep working."}{" "}
              Change the budget in{" "}
              <Link href="/settings" className="underline underline-offset-2">
                Settings → Tests &amp; timing
              </Link>
              .
            </p>
            <Button
              className="w-full"
              onClick={() => setStartedAt(claimExamStart(clockKey))}
            >
              <Play className="size-4" /> Start quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*  Quiz                                                                   */
  /* ---------------------------------------------------------------------- */

  const timeUp = quizMinutes !== null && clock.expired;
  const locked = timeUp && preferences.autoSubmitOnTimeUp;
  const isTimeLow = clock.remainingSec <= preferences.warnAtMinutes * 60;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      {preferences.proctoringEnabled && (
        <ProctoringGuard
          active
          maxViolations={3}
          violations={violations}
          onViolation={(v) => setViolations((prev) => [...prev, v])}
          onMaxViolationsExceeded={submit}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/tests"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All tests
        </Link>

        <div className="flex items-center gap-2">
          {quizMinutes !== null &&
            (preferences.showTimer ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-sm font-semibold tabular-nums",
                  isTimeLow
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "bg-muted text-foreground"
                )}
                role="timer"
              >
                <Clock className="size-3.5" /> {formatClock(clock.remainingSec)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <EyeOff className="size-3.5" /> Clock hidden
              </span>
            ))}

          {preferences.proctoringEnabled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-3.5" /> Proctoring active
            </span>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{test.title}</h1>
        <p className="text-sm text-muted-foreground">
          {total} question{total === 1 ? "" : "s"} · Practice Test
        </p>
      </div>

      {timeUp && !preferences.autoSubmitOnTimeUp && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
          Time is up. In a real exam this paper would already be submitted.
        </div>
      )}

      <div className="space-y-4">
        {questions.map((tq, index) => {
          const q = tq.question;
          const options = Array.isArray(q.options) ? q.options : null;
          const isMcq = q.type === "mcq" && options;
          const isNumeric = q.type === "numeric";
          return (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-base font-medium leading-snug">
                  {index + 1}. <MathText>{q.content}</MathText>
                </CardTitle>
                <div className="flex flex-wrap items-center gap-1.5">
                  {q.source && (
                    <Badge variant="secondary" className="text-[10px]">
                      {SOURCE_LABEL[q.source] ?? q.source}
                      {q.metadata?.year ? ` · ${q.metadata.year}` : ""}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {q.type.replace(/_/g, " ")} · {q.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isMcq ? (
                  <div className="space-y-2">
                    {options.map((opt) => {
                      const selected = answers[q.id] === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          disabled={locked}
                          onClick={() => setAnswers({ ...answers, [q.id]: opt.label })}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:bg-muted",
                            locked && "cursor-not-allowed opacity-60"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                              selected && "border-primary bg-primary text-primary-foreground"
                            )}
                          >
                            {opt.label}
                          </span>
                          <MathText>{opt.text}</MathText>
                        </button>
                      );
                    })}
                  </div>
                ) : isNumeric ? (
                  <div className="max-w-xs space-y-1.5">
                    <Input
                      inputMode="decimal"
                      placeholder="e.g. 24 or 3.14"
                      disabled={locked}
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="font-mono tabular-nums"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the value only. Answers within 0.5% are marked correct.
                    </p>
                  </div>
                ) : (
                  <Textarea
                    placeholder="Type your answer…"
                    disabled={locked}
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    rows={5}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/90 backdrop-blur md:pl-64">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {answeredCount} of {total} answered
          </span>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Submit test
          </Button>
        </div>
      </div>
    </div>
  );
}
