"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { MathText } from "@/components/shared/math-text";
import { Loader2, Layers, RotateCcw, PartyPopper } from "lucide-react";

interface DueCard {
  id: string;
  front: string;
  back: string;
  topic: { id: string; title: string };
}

const ratings = [
  { label: "Again", value: "again", key: "1", className: "bg-rose-500 hover:bg-rose-600 text-white" },
  { label: "Hard", value: "hard", key: "2", className: "bg-amber-500 hover:bg-amber-600 text-white" },
  { label: "Good", value: "good", key: "3", className: "bg-primary hover:bg-primary/90 text-primary-foreground" },
  { label: "Easy", value: "easy", key: "4", className: "bg-emerald-500 hover:bg-emerald-600 text-white" },
] as const;

export default function FlashcardsPage() {
  const [queue, setQueue] = useState<DueCard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tally, setTally] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/flashcards/due")
      .then((r) => r.json())
      .then((data) => setQueue(data.cards ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const card = queue[index];
  const done = !loading && index >= queue.length && queue.length > 0;

  const rate = useCallback(
    async (rating: string) => {
      const current = queue[index];
      if (!current) return;
      setTally((t) => ({ ...t, [rating]: (t[rating] ?? 0) + 1 }));
      setFlipped(false);
      setIndex((i) => i + 1);
      await fetch("/api/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId: current.id, rating }),
      }).catch(() => {});
    },
    [queue, index]
  );

  // Keyboard shortcuts: space/enter flips; 1–4 rate when flipped.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!card) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if (flipped) {
        const r = ratings.find((x) => x.key === e.key);
        if (r) {
          e.preventDefault();
          rate(r.value);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, flipped, rate]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No flashcards due"
        description="You're all caught up. Open a topic to generate flashcards from your notes, then come back to review."
        className="h-[60vh]"
      >
        <Link href="/subjects" className={cn(buttonVariants())}>
          Go to subjects
        </Link>
      </EmptyState>
    );
  }

  if (done) {
    const reviewed = Object.values(tally).reduce((a, b) => a + b, 0);
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <PartyPopper className="size-8" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Session complete</h1>
        <p className="mt-1.5 text-muted-foreground">
          You reviewed {reviewed} card{reviewed === 1 ? "" : "s"}. Nice work.
        </p>
        <div className="mt-6 grid w-full grid-cols-4 gap-2">
          {ratings.map((r) => (
            <div
              key={r.value}
              className="rounded-lg bg-card py-3 ring-1 ring-foreground/10"
            >
              <div className="text-lg font-semibold tabular-nums">
                {tally[r.value] ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">{r.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              setIndex(0);
              setTally({});
              fetch("/api/flashcards/due")
                .then((r) => r.json())
                .then((data) => setQueue(data.cards ?? []))
                .finally(() => setLoading(false));
            }}
          >
            <RotateCcw className="size-4" /> Check for more
          </Button>
          <Link href="/dashboard" className={cn(buttonVariants())}>
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const progress = (index / queue.length) * 100;

  return (
    <div className="mx-auto max-w-2xl space-y-5 py-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Card {index + 1} of {queue.length}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
          {card.topic.title}
        </span>
      </div>
      <Progress value={progress} className="h-1.5" />

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="w-full text-left"
        aria-label="Flip card"
      >
        <Card className="min-h-[340px] cursor-pointer select-none transition-colors hover:bg-card/80">
          <CardContent className="flex min-h-[340px] flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {flipped ? "Answer" : "Question"}
            </span>
            <p
              className={cn(
                "text-balance",
                flipped ? "text-xl" : "text-2xl font-semibold"
              )}
            >
              <MathText>{flipped ? card.back : card.front}</MathText>
            </p>
            <span className="mt-2 text-xs text-muted-foreground">
              {flipped ? "Rate how well you knew it" : "Press Space to reveal"}
            </span>
          </CardContent>
        </Card>
      </button>

      <div className="grid grid-cols-4 gap-2">
        {ratings.map((r) => (
          <button
            key={r.value}
            disabled={!flipped}
            onClick={() => rate(r.value)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40",
              r.className
            )}
          >
            {r.label}
            <span className="text-[10px] opacity-70">{r.key}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
