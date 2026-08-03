"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  CircleDashed,
} from "lucide-react";

export default function TestPage() {
  const { testId } = useParams() as { testId: string };
  const [test, setTest] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/tests/${testId}`)
      .then((r) => r.json())
      .then(async (data) => {
        setTest(data);
        if (data?.status === "completed" && data.attempts?.[0]) {
          const att = await fetch(`/api/attempts/${data.attempts[0].id}`).then(
            (r) => (r.ok ? r.json() : null)
          );
          if (att) setResult(att);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [testId]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v.trim().length > 0).length,
    [answers]
  );

  async function submit() {
    setSubmitting(true);
    const res = await fetch(`/api/tests/${testId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: Object.entries(answers).map(([questionId, response]) => ({
          questionId,
          response,
        })),
      }),
    });
    const data = await res.json();
    const att = await fetch(`/api/attempts/${data.attemptId}`).then((r) =>
      r.ok ? r.json() : null
    );
    setResult(att);
    setSubmitting(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      <div className="py-16 text-center text-muted-foreground">
        Test not found.
      </div>
    );
  }

  // ---- Results view ----
  if (result) {
    const pct =
      result.maxScore > 0
        ? Math.round(((result.score ?? 0) / result.maxScore) * 100)
        : 0;
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Link
          href="/tests"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All tests
        </Link>

        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">{test.title}</p>
            <div className="text-4xl font-semibold tabular-nums">
              {result.score} / {result.maxScore}
            </div>
            <div className="w-full max-w-xs">
              <Progress value={pct} className="h-2.5" />
            </div>
            <p className="text-sm text-muted-foreground">{pct}% correct</p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {result.answers.map((a: any, i: number) => {
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
                      {i + 1}. {q.content}
                    </CardTitle>
                    <span className="ml-auto shrink-0 text-sm tabular-nums text-muted-foreground">
                      {a.score}/{a.maxScore}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Your answer: </span>
                    {a.response || <span className="italic">(blank)</span>}
                  </p>
                  {q.type === "mcq" && q.correctAnswer && !correct && (
                    <p>
                      <span className="text-muted-foreground">Correct: </span>
                      {q.correctAnswer}
                    </p>
                  )}
                  {a.feedback && (
                    <p className="rounded-md bg-muted px-3 py-2 text-muted-foreground">
                      {a.feedback}
                    </p>
                  )}
                  {q.explanation && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Explanation:{" "}
                      </span>
                      {q.explanation}
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

  // ---- Quiz view ----
  const total = test.questions.length;
  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      <Link
        href="/tests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All tests
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{test.title}</h1>
        <p className="text-sm text-muted-foreground">
          {total} question{total === 1 ? "" : "s"} · untimed
        </p>
      </div>

      <div className="space-y-4">
        {test.questions.map((tq: any, index: number) => {
          const q = tq.question;
          const isMcq = q.type === "mcq" && Array.isArray(q.options);
          return (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-base font-medium leading-snug">
                  {index + 1}. {q.content}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isMcq ? (
                  <div className="space-y-2">
                    {q.options.map((opt: any) => {
                      const selected = answers[q.id] === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() =>
                            setAnswers({ ...answers, [q.id]: opt.label })
                          }
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:bg-muted"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                              selected &&
                                "border-primary bg-primary text-primary-foreground"
                            )}
                          >
                            {opt.label}
                          </span>
                          {opt.text}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Textarea
                    placeholder="Type your answer…"
                    value={answers[q.id] ?? ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [q.id]: e.target.value })
                    }
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
