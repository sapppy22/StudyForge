"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MathText } from "@/components/shared/math-text";
import { Layers, Loader2, Check } from "lucide-react";

/**
 * "Turn what I got wrong into revision cards" — with the student choosing
 * which.
 *
 * Carding every mistake automatically sounds helpful and isn't: a slip in
 * arithmetic and a hole in a concept both come out as a card, and a queue full
 * of the former is a queue nobody opens. So the mistakes are listed, the
 * conceptual ones are the ones you tick, and nothing is scheduled that the
 * student didn't ask for.
 */

export interface MissedItem {
  /** Present for a graded quiz answer; absent for a mock paper question. */
  questionId?: string;
  topicId?: string | null;
  topicTitle?: string | null;
  content: string;
  correctAnswer?: string | null;
  yourAnswer?: string | null;
  explanation?: string | null;
}

export function MissedToFlashcards({ missed }: { missed: MissedItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [createdCount, setCreatedCount] = useState<number | null>(null);

  const items = useMemo(
    () => missed.map((item, index) => ({ item, key: item.questionId ?? `q-${index}` })),
    [missed]
  );

  if (missed.length === 0) return null;

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.key))
    );
  }

  async function create() {
    const chosen = items.filter(({ key }) => selected.has(key)).map(({ item }) => item);
    if (chosen.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/flashcards/from-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missed: chosen }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not create those cards");
      }
      const body = (await res.json()) as { created: number };
      setCreatedCount(body.created);
      setSelected(new Set());
      toast.success(
        body.created === 0
          ? "Those questions already have cards."
          : `${body.created} revision card${body.created === 1 ? "" : "s"} added, due now.`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create those cards");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-chart-5/30 bg-chart-5/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="size-4.5 text-chart-5" />
          Turn mistakes into revision cards
        </CardTitle>
        <CardDescription>
          Pick the ones that were a gap rather than a slip. Each becomes a card
          that drills the underlying concept, scheduled to come back before you
          forget it again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            {selected.size === items.length ? "Clear selection" : `Select all ${items.length}`}
          </button>
          {createdCount !== null && createdCount > 0 && (
            <Link
              href="/flashcards"
              className="inline-flex items-center gap-1 text-xs font-medium text-chart-5 underline underline-offset-2"
            >
              <Check className="size-3.5" /> Review them now
            </Link>
          )}
        </div>

        <ul className="space-y-1.5">
          {items.map(({ item, key }) => {
            const checked = selected.has(key);
            return (
              <li key={key}>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                    checked ? "border-chart-5/50 bg-chart-5/10" : "bg-card hover:bg-accent/40"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(key)}
                    className="mt-0.5"
                    aria-label={`Make a revision card for: ${item.content.slice(0, 80)}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block">
                      <MathText>{item.content}</MathText>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {item.topicTitle ? `${item.topicTitle} · ` : ""}
                      {item.yourAnswer ? `you answered "${item.yourAnswer}"` : "left blank"}
                      {item.correctAnswer ? ` · correct: ${item.correctAnswer}` : ""}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <Button onClick={create} disabled={saving || selected.size === 0} size="sm">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Layers className="size-4" />}
          Make {selected.size || ""} revision card{selected.size === 1 ? "" : "s"}
        </Button>
      </CardContent>
    </Card>
  );
}
