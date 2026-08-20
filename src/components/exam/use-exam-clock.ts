"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

/**
 * Clocks that behave like an exam hall clock.
 *
 * The obvious implementation — `setInterval` decrementing a counter — is wrong
 * in three ways that all cost the student time they should have had, or hand
 * them time they shouldn't:
 *
 *   1. Browsers throttle timers in background tabs to once a minute or less, so
 *      a paper effectively paused whenever you tabbed away. Exactly the wrong
 *      incentive for a proctored mock.
 *   2. `setInterval` drifts. Over a three-hour paper the error is minutes.
 *   3. A refresh restarted the paper with a full clock.
 *
 * So the deadline is an absolute timestamp, every repaint recomputes from
 * `Date.now()`, and the start is persisted for the session. Ticking only
 * schedules repaints; the number on screen is never a count of ticks.
 */

/* -------------------------------------------------------------------------- */
/*  One shared ticker                                                          */
/* -------------------------------------------------------------------------- */

const listeners = new Set<() => void>();
let currentTick = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;

function emit(): void {
  currentTick = Date.now();
  for (const listener of listeners) listener();
}

/**
 * Subscribes to the wall clock. Every clock on the page shares one interval,
 * and the tab-visibility listeners force an immediate recompute on return so a
 * throttled tick is never what the student sees.
 */
function subscribeTick(listener: () => void): () => void {
  listeners.add(listener);

  if (intervalId === null) {
    currentTick = Date.now();
    intervalId = setInterval(emit, 250);
    document.addEventListener("visibilitychange", emit);
    window.addEventListener("focus", emit);
    window.addEventListener("pageshow", emit);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
      document.removeEventListener("visibilitychange", emit);
      window.removeEventListener("focus", emit);
      window.removeEventListener("pageshow", emit);
    }
  };
}

const getTick = () => currentTick;
/** Nothing is ticking on the server; 0 reads as "not started yet". */
const getServerTick = () => 0;

const noopSubscribe = () => () => {};

/** Current wall-clock milliseconds, repainted about four times a second. */
export function useWallClock(active: boolean): number {
  const subscribe = useCallback(
    (listener: () => void) => (active ? subscribeTick(listener) : noopSubscribe()),
    [active]
  );
  return useSyncExternalStore(subscribe, getTick, getServerTick);
}

/* -------------------------------------------------------------------------- */
/*  Persistence                                                                */
/* -------------------------------------------------------------------------- */

function storageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && Boolean(window.sessionStorage);
  } catch {
    // Safari in private mode throws on access rather than returning null.
    return false;
  }
}

function readNumber(key: string): number | null {
  if (!storageAvailable()) return null;
  const raw = window.sessionStorage.getItem(key);
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) ? value : null;
}

function readMap(key: string): Record<string, number> {
  if (!storageAvailable()) return {};
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(key) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
  } catch {
    // A corrupt entry is not worth failing the paper over.
    return {};
  }
}

/* -------------------------------------------------------------------------- */
/*  The paper clock                                                            */
/* -------------------------------------------------------------------------- */

const examKey = (storageKey: string) => `sf.exam-clock.${storageKey}`;

/** The stored start for a paper, or null if it has never been started. */
export function readExamStart(storageKey: string): number | null {
  return readNumber(examKey(storageKey));
}

/**
 * Starts the paper, or resumes the start already recorded for it.
 *
 * Call this from the handler that starts the exam — never during render. The
 * clock itself is pure: it only ever derives from the timestamp handed to it,
 * which is what lets a refresh mid-paper resume on the right second instead of
 * handing back a full clock.
 */
export function claimExamStart(storageKey: string): number {
  const existing = readExamStart(storageKey);
  if (existing !== null) return existing;

  const start = Date.now();
  if (storageAvailable()) window.sessionStorage.setItem(examKey(storageKey), String(start));
  return start;
}

/** Forgets a paper's start, so a retake gets a full clock. */
export function clearExamStart(storageKey: string): void {
  if (storageAvailable()) window.sessionStorage.removeItem(examKey(storageKey));
}

interface ExamClockOptions {
  /** Total time for the paper. */
  durationSec: number;
  /** When the paper started, from `claimExamStart`. Null before it starts. */
  startedAt: number | null;
  onExpire?: () => void;
}

export interface ExamClock {
  remainingSec: number;
  elapsedSec: number;
  expired: boolean;
}

export function useExamClock({
  durationSec,
  startedAt,
  onExpire,
}: ExamClockOptions): ExamClock {
  const now = useWallClock(startedAt !== null);

  // `now` is 0 until the first tick lands, which would otherwise read as the
  // whole paper having elapsed.
  const elapsedSec =
    startedAt === null || now === 0 ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
  const remainingSec = Math.max(0, durationSec - elapsedSec);
  const expired = startedAt !== null && now !== 0 && remainingSec === 0;

  const firedRef = useRef(false);
  const expireRef = useRef(onExpire);

  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!expired || firedRef.current) return;
    firedRef.current = true;
    expireRef.current?.();
  }, [expired]);

  return { remainingSec, elapsedSec, expired };
}

/* -------------------------------------------------------------------------- */
/*  Per-question stopwatch                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Time is banked when the active question changes rather than incremented on a
 * tick, so a throttled or missed interval cannot lose seconds and the per
 * question totals still add up to the time actually spent on the paper.
 */
export function useQuestionTimer(activeQuestionId: string | undefined, running: boolean) {
  const totals = useRef<Record<string, number>>({});
  const open = useRef<{ id: string; since: number } | null>(null);

  const bank = useCallback(() => {
    const current = open.current;
    if (!current) return;
    const spent = Math.max(0, Math.round((Date.now() - current.since) / 1000));
    totals.current[current.id] = (totals.current[current.id] ?? 0) + spent;
    open.current = null;
  }, []);

  useEffect(() => {
    bank();
    if (!running || !activeQuestionId) return;
    open.current = { id: activeQuestionId, since: Date.now() };
    // Bank on unmount too, so the last question isn't recorded as zero.
    return bank;
  }, [activeQuestionId, running, bank]);

  // Leaving the tab shouldn't credit a question with time you weren't there
  // for; coming back restarts its stopwatch.
  useEffect(() => {
    if (!running) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") bank();
      else if (activeQuestionId) open.current = { id: activeQuestionId, since: Date.now() };
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [running, activeQuestionId, bank]);

  /** Totals including the question currently open, which stays open. */
  const snapshot = useCallback(() => {
    bank();
    if (running && activeQuestionId) {
      open.current = { id: activeQuestionId, since: Date.now() };
    }
    return { ...totals.current };
  }, [bank, running, activeQuestionId]);

  return { snapshot };
}

/** `HH:MM:SS`, or `MM:SS` under an hour — how a CBT clock actually reads. */
export function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) return "--:--";
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/* -------------------------------------------------------------------------- */
/*  Sectional clocks                                                           */
/* -------------------------------------------------------------------------- */

export interface SectionClockState {
  /** Seconds left in the section the student is currently in. */
  remainingSec: number;
  /** Sections whose time has run out and can no longer be answered. */
  lockedSectionIds: string[];
  /** Starts a section's clock; call it wherever the active section changes. */
  enterSection: (sectionId: string) => void;
  /** Marks the current section finished early and moves the clock on. */
  finishSection: (sectionId: string) => void;
}

/**
 * Clocks for exams that lock a section when its own time runs out.
 *
 * Each section's clock starts when the student first enters it, which is how
 * CAT and the banking prelims behave — section two's forty minutes do not begin
 * until section one is done with.
 */
export function useSectionClocks(params: {
  sections: { id: string; durationMinutes?: number }[];
  activeSectionId: string;
  enabled: boolean;
  storageKey: string;
}): SectionClockState {
  const { sections, activeSectionId, enabled, storageKey } = params;
  const key = `sf.section-clock.${storageKey}`;

  const [entered, setEntered] = useState<Record<string, number>>(() =>
    enabled ? readMap(key) : {}
  );
  const [manuallyFinished, setManuallyFinished] = useState<string[]>([]);
  const now = useWallClock(enabled && Object.keys(entered).length > 0);

  /**
   * Starts a section's clock the first time the student enters it. Called from
   * the navigation handlers, so nothing impure happens during render.
   */
  const enterSection = useCallback(
    (sectionId: string) => {
      if (!enabled || !sectionId) return;
      setEntered((prev) => {
        if (prev[sectionId]) return prev;
        const next = { ...prev, [sectionId]: Date.now() };
        if (storageAvailable()) window.sessionStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [enabled, key]
  );

  const lockedSectionIds = useMemo(() => {
    if (!enabled) return [];
    return sections
      .filter((section) => {
        if (manuallyFinished.includes(section.id)) return true;
        const limit = section.durationMinutes;
        const start = entered[section.id];
        if (!limit || !start || now === 0) return false;
        return now - start >= limit * 60_000;
      })
      .map((section) => section.id);
  }, [enabled, sections, entered, now, manuallyFinished]);

  const activeSection = sections.find((s) => s.id === activeSectionId);
  const activeStart = entered[activeSectionId];
  const remainingSec =
    !enabled || !activeSection?.durationMinutes || !activeStart || now === 0
      ? Number.POSITIVE_INFINITY
      : Math.max(0, activeSection.durationMinutes * 60 - Math.floor((now - activeStart) / 1000));

  const finishSection = useCallback((sectionId: string) => {
    setManuallyFinished((prev) => (prev.includes(sectionId) ? prev : [...prev, sectionId]));
  }, []);

  return { remainingSec, lockedSectionIds, enterSection, finishSection };
}
