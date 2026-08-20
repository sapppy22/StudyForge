"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDuration } from "./use-solve-timer";
import { MathText } from "@/components/shared/math-text";
import { Bookmark, ChevronDown, Lightbulb, Pause, Timer } from "lucide-react";
import type { BankRow } from "./types";

const difficultyStyles: Record<string, string> = {
  easy: "bg-chart-3/15 text-chart-3 border-transparent",
  medium: "bg-chart-5/15 text-chart-5 border-transparent",
  hard: "bg-destructive/15 text-destructive border-transparent",
};

export function QuestionRow({
  question,
  index,
  timing,
  onToggleSolved,
  onToggleBookmark,
  onStartTimer,
  onStopTimer,
}: {
  question: BankRow;
  index: number;
  /** Live seconds when this row owns the stopwatch, otherwise null. */
  timing: number | null;
  onToggleSolved: (solved: boolean) => void;
  onToggleBookmark: (bookmarked: boolean) => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  /** Local only — the sheet is self-checked, so nothing is submitted. */
  const [choice, setChoice] = useState<string | null>(null);

  const options = question.options ?? null;
  const isObjective = Boolean(options?.length);
  const progress = question.progress[0];
  const solved = progress?.solved ?? false;
  const bookmarked = progress?.bookmarked ?? false;
  const bestTime = progress?.bestTimeSec ?? null;
  const targetSec = question.expectedMinutes * 60;
  const running = timing !== null;

  // Comparing your best against the target is the point of timing the sheet at
  // all, so surface it as soon as there is a best time to compare.
  const beatTarget = bestTime !== null && bestTime <= targetSec;

  return (
    <div
      className={cn(
        "group rounded-xl border px-3 py-2.5 transition-colors",
        solved ? "border-primary/30 bg-primary/5" : "bg-card hover:bg-accent/40",
        running && "border-primary ring-1 ring-primary/30"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={solved}
          onCheckedChange={(checked) => onToggleSolved(Boolean(checked))}
          aria-label={solved ? "Mark as unsolved" : "Mark as solved"}
          className="mt-1"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <Badge
              variant="outline"
              className={cn("capitalize", difficultyStyles[question.difficulty])}
            >
              {question.difficulty}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {question.chapter}
              {question.topic && ` · ${question.topic}`}
            </span>
            <Badge variant="secondary" className="text-[10px] capitalize">
              {question.type.replace(/_/g, " ")}
            </Badge>
            <span className="text-xs text-muted-foreground">
              · target {question.expectedMinutes}m
            </span>
            {bestTime !== null && (
              <span
                className={cn(
                  "text-xs tabular-nums",
                  beatTarget ? "text-primary" : "text-muted-foreground"
                )}
                title={beatTarget ? "Beat the target time" : "Slower than target"}
              >
                · best {formatDuration(bestTime)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 block w-full text-left"
          >
            <p
              className={cn(
                "text-sm leading-relaxed",
                !expanded && "line-clamp-2",
                solved && "text-muted-foreground"
              )}
            >
              <MathText>{question.content}</MathText>
            </p>
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {isObjective && (
                <div className="space-y-1.5">
                  {options!.map((option) => {
                    const picked = choice === option.label;
                    // Revealed only once the solution is, so the sheet stays a
                    // test rather than a multiple-guess.
                    const isKey =
                      showSolution && question.correctAnswer?.trim().toUpperCase() === option.label;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setChoice(picked ? null : option.label)}
                        className={cn(
                          "flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          isKey
                            ? "border-primary bg-primary/10"
                            : picked
                              ? "border-foreground/40 bg-accent"
                              : "hover:bg-accent/50"
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                            (isKey || picked) && "border-primary bg-primary text-primary-foreground"
                          )}
                        >
                          {option.label}
                        </span>
                        <MathText>{option.text}</MathText>
                      </button>
                    );
                  })}
                  {choice && !showSolution && (
                    <p className="text-xs text-muted-foreground">
                      Answer noted — reveal the solution to check it.
                    </p>
                  )}
                </div>
              )}

              {question.hint && (
                <div>
                  {showHint ? (
                    <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                      <Lightbulb className="mr-1.5 inline size-3.5 text-chart-5" />
                      <MathText>{question.hint}</MathText>
                    </p>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHint(true)}
                    >
                      <Lightbulb className="size-3.5" /> Show hint
                    </Button>
                  )}
                </div>
              )}

              <div>
                <Button
                  variant={showSolution ? "ghost" : "outline"}
                  size="sm"
                  onClick={() => setShowSolution((v) => !v)}
                >
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform",
                      showSolution && "rotate-180"
                    )}
                  />
                  {showSolution ? "Hide solution" : "Reveal solution"}
                </Button>

                {showSolution && (
                  <div className="mt-2 space-y-2 rounded-lg border border-dashed p-3">
                    {question.correctAnswer && (
                      <p className="text-sm">
                        <span className="font-medium">Answer: </span>
                        <MathText>{question.correctAnswer}</MathText>
                      </p>
                    )}
                    {question.solution && (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        <MathText>{question.solution}</MathText>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {question.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {question.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {running && (
            <span className="font-mono text-sm tabular-nums text-primary">
              {formatDuration(timing)}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={running ? "Stop timer" : "Start timer"}
            title={running ? "Stop timer" : "Start solving — start the timer"}
            onClick={running ? onStopTimer : onStartTimer}
          >
            {running ? (
              <Pause className="size-4 text-primary" />
            ) : (
              <Timer className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
            onClick={() => onToggleBookmark(!bookmarked)}
          >
            <Bookmark
              className={cn(
                "size-4",
                bookmarked && "fill-chart-5 text-chart-5"
              )}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}
