"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Loader2, Timer } from "lucide-react";

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
      .then((data) => {
        setTest(data);
        setLoading(false);
      });
  }, [testId]);

  async function submit() {
    setSubmitting(true);
    const topicId = test.settings?.topicId;
    const res = await fetch(`/api/tests/${testId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: Object.entries(answers).map(([questionId, response]) => ({ questionId, response })), topicId }),
    });
    const data = await res.json();
    setResult(data);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Test submitted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-semibold">
              {result.score} / {result.maxScore}
            </div>
            <Progress value={(result.score / result.maxScore) * 100} className="h-3" />
            <Button onClick={() => (window.location.href = "/dashboard")}>Back to dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{test.title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="h-4 w-4" />
          <span>Untimed</span>
        </div>
      </div>

      <div className="space-y-6">
        {test.questions.map((tq: any, index: number) => {
          const q = tq.question;
          return (
            <Card key={q.id} className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  {index + 1}. {q.content}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {q.type === "mcq" && q.options && (
                  <RadioGroup
                    value={answers[q.id]}
                    onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}
                    className="space-y-2"
                  >
                    {q.options.map((opt: any) => (
                      <div key={opt.label} className="flex items-center space-x-2 rounded-md border p-3">
                        <RadioGroupItem value={opt.label} id={`${q.id}-${opt.label}`} />
                        <Label htmlFor={`${q.id}-${opt.label}`}>{opt.label}. {opt.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                {q.type !== "mcq" && (
                  <Textarea
                    placeholder="Type your answer..."
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    rows={6}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={submit}
        disabled={submitting}
      >
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit test
      </Button>
    </div>
  );
}
