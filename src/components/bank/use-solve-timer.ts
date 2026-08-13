"use client";

import { useEffect, useState } from "react";

/**
 * A single-slot stopwatch for the question bank.
 *
 * Only one question can be timed at a time, which matches how the sheet is
 * actually used — you sit with one problem — and avoids a screen full of
 * competing clocks. Starting a timer on a new question returns the elapsed
 * time of the one it displaced so the caller can bank it.
 *
 * Elapsed time is derived from a wall-clock start stamp rather than by counting
 * interval ticks, so a backgrounded tab (where timers get throttled) still
 * reports the true duration.
 */
export interface ActiveTimer {
  questionId: string;
  startedAt: number;
}

export function useSolveTimer() {
  const [active, setActive] = useState<ActiveTimer | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // The interval only re-stamps `now`; elapsed is derived below. Nothing is set
  // synchronously in the effect body, and there is no ref read during render.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  const elapsed = active
    ? Math.max(0, Math.floor((now - active.startedAt) / 1000))
    : 0;

  // These run from event handlers, so the `active` captured in this render's
  // closure is always the current one — no ref needed.

  /** Starts timing a question; returns the displaced timer's elapsed seconds. */
  function start(questionId: string) {
    const displaced =
      active && active.questionId !== questionId
        ? {
            questionId: active.questionId,
            seconds: Math.floor((Date.now() - active.startedAt) / 1000),
          }
        : null;

    setActive({ questionId, startedAt: Date.now() });
    setNow(Date.now());
    return displaced;
  }

  /** Stops the timer (only if it is on `questionId`, when given) and returns elapsed seconds. */
  function stop(questionId?: string) {
    if (!active) return 0;
    if (questionId && active.questionId !== questionId) return 0;

    setActive(null);
    return Math.floor((Date.now() - active.startedAt) / 1000);
  }

  return {
    activeQuestionId: active?.questionId ?? null,
    elapsed,
    start,
    stop,
  };
}

/** Formats seconds as m:ss, or h:mm:ss once it passes an hour. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
