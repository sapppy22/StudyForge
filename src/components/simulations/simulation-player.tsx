"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { QuestionType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ProctoringGuard } from "./proctoring-guard";
import { MathText } from "@/components/shared/math-text";
import {
  claimExamStart,
  clearExamStart,
  formatClock,
  useExamClock,
  useQuestionTimer,
  useSectionClocks,
} from "@/components/exam/use-exam-clock";
import type { TestPreferences } from "@/lib/test-timing";
import type {
  SimulationMock,
  SimulationAttemptResult,
  SimulationQuestion,
  ProctoringViolation,
} from "@/data/simulations/types";
import {
  Clock,
  ShieldCheck,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  Maximize2,
  FileText,
  AlertCircle,
  Lock,
  Loader2,
  EyeOff,
} from "lucide-react";

interface SimulationPlayerProps {
  simulation: SimulationMock;
  user: { id: string; email: string; name?: string | null };
  /** Resolved clock for this paper, in minutes. */
  durationMinutes: number;
  preferences: TestPreferences;
  onComplete: (result: SimulationAttemptResult) => void;
}

type QuestionStatus = "not_visited" | "not_answered" | "answered" | "marked" | "answered_marked";

const MULTI_SELECT = QuestionType.msq;
const WRITTEN_TYPES: QuestionType[] = [QuestionType.short_answer, QuestionType.long_answer];

function typeLabel(question: SimulationQuestion | undefined): string {
  switch (question?.type) {
    case QuestionType.numeric:
      return "Numerical answer";
    case QuestionType.msq:
      return "One or more correct";
    case QuestionType.short_answer:
      return "Short answer";
    case QuestionType.long_answer:
      return "Written answer";
    default:
      return "Single choice";
  }
}

export function SimulationPlayer({
  simulation,
  user,
  durationMinutes,
  preferences,
  onComplete,
}: SimulationPlayerProps) {
  const [activeSectionId, setActiveSectionId] = useState(simulation.sections[0]?.id || "");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, QuestionStatus>>(() => {
    const initStatuses: Record<string, QuestionStatus> = {};
    simulation.questions.forEach((q) => {
      initStatuses[q.id] = "not_visited";
    });
    if (simulation.questions[0]) {
      initStatuses[simulation.questions[0].id] = "not_answered";
    }
    return initStatuses;
  });

  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaperModal, setShowPaperModal] = useState(false);

  const proctoringActive = startedAt !== null;
  const totalSeconds = durationMinutes * 60;
  // Two students can hold different clocks for the same paper, so the length is
  // part of the key: changing it in Settings starts a fresh clock rather than
  // resuming one measured against the old duration.
  const clockKey = `${simulation.id}:${durationMinutes}`;

  const sectionQuestions = useMemo(
    () => simulation.questions.filter((q) => q.sectionId === activeSectionId),
    [simulation.questions, activeSectionId]
  );
  const currentQuestion = sectionQuestions[activeQuestionIndex] || simulation.questions[0];

  const { snapshot: questionTimes } = useQuestionTimer(
    currentQuestion?.id,
    proctoringActive && !isSubmitting
  );

  const submittedRef = useRef(false);

  const handleSubmitTest = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    const perQuestion = questionTimes();
    const elapsed = Object.values(perQuestion).reduce((sum, n) => sum + n, 0);

    const payload = {
      answers: Object.entries(answers).map(([questionId, response]) => ({
        questionId,
        response,
        timeSpentSec: perQuestion[questionId] || 0,
      })),
      timeSpentSec: Math.min(elapsed, totalSeconds),
      proctoringViolations: violations,
    };

    try {
      const res = await fetch(`/api/simulations/${simulation.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Your paper could not be submitted.");
      }
      const result: SimulationAttemptResult = await res.json();

      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
      // The paper is over, so the persisted clock has to go or a retake would
      // resume the finished one.
      clearExamStart(clockKey);
      onComplete(result);
    } catch (err) {
      console.error("Failed to submit simulation:", err);
      // The answers only exist in this component, so a failed submit must be
      // visible and retryable. It used to fail to the console alone: the
      // button went back to idle, the dialog stayed open with no explanation,
      // and an auto-submit (time up, or three proctoring violations) failed
      // with no sign at all that the paper had not been marked.
      setSubmitError(
        err instanceof Error ? err.message : "Your paper could not be submitted."
      );
      setShowSubmitModal(true);
      submittedRef.current = false;
      setIsSubmitting(false);
    }
  }, [answers, violations, questionTimes, simulation.id, totalSeconds, clockKey, onComplete]);

  const onExpire = useCallback(() => {
    if (preferences.autoSubmitOnTimeUp) void handleSubmitTest();
  }, [preferences.autoSubmitOnTimeUp, handleSubmitTest]);

  const clock = useExamClock({
    durationSec: totalSeconds,
    startedAt,
    onExpire,
  });

  const sectionalEnabled =
    Boolean(simulation.sectionalTiming) && preferences.enforceSectionalTiming;

  const sectionClocks = useSectionClocks({
    sections: simulation.sections,
    activeSectionId,
    enabled: sectionalEnabled,
    storageKey: simulation.id,
  });

  const lockedSections = sectionClocks.lockedSectionIds;
  const currentSectionLocked = lockedSections.includes(activeSectionId);
  const timeUp = clock.expired;
  const answeringDisabled = currentSectionLocked || (timeUp && preferences.autoSubmitOnTimeUp);

  /** Every path that changes section also has to start that section's clock. */
  const goToSection = useCallback(
    (sectionId: string) => {
      setActiveSectionId(sectionId);
      setActiveQuestionIndex(0);
      sectionClocks.enterSection(sectionId);
    },
    [sectionClocks]
  );

  const startExam = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen can be refused (an iframe, a policy); the paper still runs.
    }
    // Resumes the stored start when this paper was already under way.
    setStartedAt(claimExamStart(clockKey));
    sectionClocks.enterSection(activeSectionId);
  }, [clockKey, sectionClocks, activeSectionId]);

  /* ---------------------------------------------------------------------- */
  /*  Answering                                                              */
  /* ---------------------------------------------------------------------- */

  const setAnswer = (value: string) => {
    if (!currentQuestion || answeringDisabled) return;
    setAnswers((prev) => {
      const next = { ...prev };
      if (value.trim().length === 0) delete next[currentQuestion.id];
      else next[currentQuestion.id] = value;
      return next;
    });
    setStatuses((prev) => {
      const wasMarked = prev[currentQuestion.id]?.includes("marked");
      const answered = value.trim().length > 0;
      return {
        ...prev,
        [currentQuestion.id]: answered
          ? wasMarked
            ? "answered_marked"
            : "answered"
          : wasMarked
            ? "marked"
            : "not_answered",
      };
    });
  };

  /** MSQ answers are stored as a sorted, comma-joined label list. */
  const toggleMultiOption = (label: string) => {
    if (!currentQuestion) return;
    const selected = new Set(
      (answers[currentQuestion.id] ?? "").split(",").map((s) => s.trim()).filter(Boolean)
    );
    if (selected.has(label)) selected.delete(label);
    else selected.add(label);
    setAnswer(Array.from(selected).sort().join(","));
  };

  const clearResponse = () => setAnswer("");

  const markForReview = () => {
    if (!currentQuestion) return;
    const hasAnswer = Boolean(answers[currentQuestion.id]?.trim());
    setStatuses((prev) => ({
      ...prev,
      [currentQuestion.id]: hasAnswer ? "answered_marked" : "marked",
    }));
    goToNextQuestion();
  };

  const saveAndNext = () => {
    if (!currentQuestion) return;
    const hasAnswer = Boolean(answers[currentQuestion.id]?.trim());
    setStatuses((prev) => ({
      ...prev,
      [currentQuestion.id]: hasAnswer ? "answered" : "not_answered",
    }));
    goToNextQuestion();
  };

  const visit = (questionId: string) => {
    setStatuses((prev) =>
      prev[questionId] === "not_visited" ? { ...prev, [questionId]: "not_answered" } : prev
    );
  };

  const goToNextQuestion = () => {
    if (activeQuestionIndex < sectionQuestions.length - 1) {
      const nextQ = sectionQuestions[activeQuestionIndex + 1];
      setActiveQuestionIndex(activeQuestionIndex + 1);
      visit(nextQ.id);
      return;
    }
    // Fall through to the next section that is still open.
    const currentSecIdx = simulation.sections.findIndex((s) => s.id === activeSectionId);
    const nextOpen = simulation.sections
      .slice(currentSecIdx + 1)
      .find((s) => !lockedSections.includes(s.id));
    if (nextOpen) goToSection(nextOpen.id);
  };

  const goToPrevQuestion = () => {
    if (activeQuestionIndex > 0) setActiveQuestionIndex(activeQuestionIndex - 1);
  };

  const jumpToQuestion = (secId: string, qIndex: number) => {
    if (secId !== activeSectionId) sectionClocks.enterSection(secId);
    setActiveSectionId(secId);
    setActiveQuestionIndex(qIndex);
    const targetQ = simulation.questions.filter((q) => q.sectionId === secId)[qIndex];
    if (targetQ) visit(targetQ.id);
  };

  const summaryCounts = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let marked = 0;
    let answeredMarked = 0;
    let notVisited = 0;

    simulation.questions.forEach((q) => {
      const st = statuses[q.id] || "not_visited";
      if (st === "answered") answered++;
      else if (st === "not_answered") notAnswered++;
      else if (st === "marked") marked++;
      else if (st === "answered_marked") answeredMarked++;
      else notVisited++;
    });

    return { answered, notAnswered, marked, answeredMarked, notVisited };
  }, [simulation.questions, statuses]);

  /* ---------------------------------------------------------------------- */
  /*  Pre-exam instructions                                                  */
  /* ---------------------------------------------------------------------- */

  if (!proctoringActive) {
    const differsFromOfficial = durationMinutes !== simulation.durationMinutes;
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-6">
        <Card className="border-emerald-500/20 bg-zinc-950">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="size-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              {simulation.title}
            </CardTitle>
            <p className="text-sm text-zinc-400">{simulation.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
              <div>
                <span className="text-xs text-zinc-400 uppercase">Duration</span>
                <p className="text-lg font-bold text-white">{durationMinutes} Mins</p>
                {differsFromOfficial && (
                  <p className="text-[11px] text-amber-400">
                    Official is {simulation.durationMinutes} — set in Settings
                  </p>
                )}
              </div>
              <div>
                <span className="text-xs text-zinc-400 uppercase">Total Marks</span>
                <p className="text-lg font-bold text-emerald-400">{simulation.totalMarks}</p>
              </div>
              <div>
                <span className="text-xs text-zinc-400 uppercase">Total Questions</span>
                <p className="text-lg font-bold text-white">{simulation.questions.length}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">
                Official CBT Examination Instructions:
              </h3>
              <ul className="space-y-2 text-sm text-zinc-300">
                {simulation.instructions.map((inst, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{inst}</span>
                  </li>
                ))}
                {sectionalEnabled && (
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>
                      Sectional time limits are enforced: a section locks when its
                      own clock expires and cannot be reopened.
                    </span>
                  </li>
                )}
                {!preferences.autoSubmitOnTimeUp && (
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>
                      Auto-submit is off in your settings — you&apos;ll be warned at
                      zero but can keep working.
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {preferences.proctoringEnabled ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-4 text-sm text-rose-300">
                <div className="flex items-center gap-2 font-semibold text-rose-400 mb-1">
                  <AlertCircle className="size-4" />
                  Anti-Cheat Proctoring Protocol Active
                </div>
                <p className="text-xs text-rose-300/80">
                  This test will launch in full screen. Any application switch, tab
                  navigation, or window minimizing will be recorded as a violation. 3
                  violations will trigger automatic disqualification and submission.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4 text-xs text-zinc-400">
                Proctoring is off in your settings — tab switches won&apos;t be flagged.
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={startExam}
                size="lg"
                className="w-full bg-emerald-600 font-bold text-zinc-950 hover:bg-emerald-500"
              >
                <Maximize2 className="mr-2 size-5" />
                I am Ready — Start {preferences.proctoringEnabled ? "Proctored " : ""}Exam
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*  Live paper                                                             */
  /* ---------------------------------------------------------------------- */

  const currentAnswer = answers[currentQuestion?.id] || "";
  const selectedLabels = new Set(
    currentAnswer.split(",").map((s) => s.trim()).filter(Boolean)
  );
  const warnSeconds = preferences.warnAtMinutes * 60;
  const isTimeLow = clock.remainingSec <= warnSeconds;
  const sectionRemaining = sectionClocks.remainingSec;
  const showSectionClock = sectionalEnabled && Number.isFinite(sectionRemaining);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-zinc-950 text-zinc-100 select-none overflow-hidden">
      {preferences.proctoringEnabled && (
        <ProctoringGuard
          active={proctoringActive}
          maxViolations={3}
          violations={violations}
          onViolation={(v) => setViolations((prev) => [...prev, v])}
          onMaxViolationsExceeded={handleSubmitTest}
        />
      )}

      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-emerald-500 text-zinc-950 font-black text-xs">
              CBT
            </span>
            <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
              {simulation.title}
            </span>
          </div>
          {preferences.proctoringEnabled && (
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-xs"
            >
              <ShieldCheck className="mr-1 size-3" /> Proctored Mode
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          {preferences.showTimer ? (
            <div className="flex items-center gap-2">
              {showSectionClock && (
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-sm font-bold tabular-nums",
                    sectionRemaining <= 120
                      ? "border-amber-500/50 bg-amber-950/40 text-amber-400"
                      : "border-zinc-700 bg-zinc-800/80 text-zinc-200"
                  )}
                  title="Time left in this section"
                >
                  <Lock className="size-3.5" />
                  <span>{formatClock(sectionRemaining)}</span>
                </div>
              )}
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1 font-mono text-base font-bold tabular-nums border",
                  isTimeLow
                    ? "border-rose-500/50 bg-rose-950/40 text-rose-400 animate-pulse"
                    : "border-zinc-700 bg-zinc-800/80 text-emerald-400"
                )}
                role="timer"
                aria-live="off"
              >
                <Clock className="size-4" />
                <span>Time Left: {formatClock(clock.remainingSec)}</span>
              </div>
            </div>
          ) : (
            <span
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-xs text-zinc-400"
              title="The clock is hidden in your settings but still running"
            >
              <EyeOff className="size-3.5" /> Clock hidden
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPaperModal(true)}
            className="border-zinc-700 hover:bg-zinc-800 hidden md:inline-flex text-xs"
          >
            <FileText className="mr-1.5 size-3.5" /> Question Paper
          </Button>

          <Button
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            className="bg-emerald-600 font-bold text-zinc-950 hover:bg-emerald-500 text-xs px-4"
          >
            <Send className="mr-1.5 size-3.5" /> Submit Test
          </Button>
        </div>
      </header>

      {timeUp && !preferences.autoSubmitOnTimeUp && (
        <div className="shrink-0 bg-rose-600 px-4 py-1.5 text-center text-xs font-semibold text-white">
          Time is up. In the real exam this paper would already be submitted.
        </div>
      )}

      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-zinc-800 bg-zinc-900/60 px-4 overflow-x-auto">
        <span className="text-xs font-semibold text-zinc-400 mr-2 uppercase tracking-wider">
          Sections:
        </span>
        {simulation.sections.map((sec) => {
          const isActive = sec.id === activeSectionId;
          const locked = lockedSections.includes(sec.id);
          const count = simulation.questions.filter((q) => q.sectionId === sec.id).length;
          const answeredInSec = simulation.questions.filter(
            (q) => q.sectionId === sec.id && answers[q.id]
          ).length;

          return (
            <button
              key={sec.id}
              onClick={() => {
                if (locked) return;
                goToSection(sec.id);
              }}
              disabled={locked}
              title={locked ? "This section's time has expired" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                locked
                  ? "cursor-not-allowed bg-zinc-900 text-zinc-600"
                  : isActive
                    ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm"
                    : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              )}
            >
              {locked && <Lock className="size-3" />}
              <span>{sec.name}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px]",
                  isActive && !locked ? "bg-zinc-950 text-emerald-400" : "bg-zinc-700 text-zinc-300"
                )}
              >
                {answeredInSec}/{count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">
                  Question {activeQuestionIndex + 1}
                </span>
                <span className="text-xs text-zinc-400">
                  (of {sectionQuestions.length} in{" "}
                  {simulation.sections.find((s) => s.id === activeSectionId)?.name})
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                >
                  +{currentQuestion?.marks ?? 4} Marks
                </Badge>
                {preferences.negativeMarkingEnabled && (currentQuestion?.negativeMarks ?? 0) > 0 && (
                  <Badge variant="outline" className="border-rose-500/30 text-rose-400 bg-rose-500/10">
                    -{currentQuestion?.negativeMarks} Negative
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                  {currentQuestion?.partLabel ?? typeLabel(currentQuestion)}
                </Badge>
              </div>
            </div>

            {currentSectionLocked && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-sm text-amber-300">
                <Lock className="size-4 shrink-0" />
                This section&apos;s time has expired. Your answers are saved; move to
                a section that is still open.
              </div>
            )}

            <div className="text-base sm:text-lg leading-relaxed text-zinc-100 font-normal py-2 font-sans">
              <MathText>{currentQuestion?.content}</MathText>
            </div>

            {currentQuestion?.type === QuestionType.numeric ? (
              <div className="my-6 max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                <label
                  htmlFor="numeric-answer"
                  className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
                >
                  Enter Your Numerical Answer:
                </label>
                <Input
                  id="numeric-answer"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 24 or 3.14"
                  value={currentAnswer}
                  disabled={answeringDisabled}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="font-mono text-lg font-bold border-zinc-700 bg-zinc-950 text-emerald-400 focus-visible:ring-emerald-500"
                />
                <p className="text-[11px] text-zinc-500">
                  Enter integer or decimal value. Round off to 2 decimal places if needed.
                </p>
              </div>
            ) : WRITTEN_TYPES.includes(currentQuestion?.type as QuestionType) ? (
              <div className="my-4 space-y-2">
                <Textarea
                  value={currentAnswer}
                  disabled={answeringDisabled}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={currentQuestion?.type === QuestionType.long_answer ? 12 : 4}
                  placeholder="Type your answer…"
                  className="border-zinc-800 bg-zinc-900/60 text-zinc-100"
                />
                <p className="text-[11px] text-zinc-500 tabular-nums">
                  {currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0} words
                </p>
              </div>
            ) : (
              <div className="space-y-3 my-4">
                {currentQuestion?.type === MULTI_SELECT && (
                  <p className="text-xs text-amber-400">
                    Select every option that applies.
                  </p>
                )}
                {currentQuestion?.options?.map((opt) => {
                  const isSelected =
                    currentQuestion.type === MULTI_SELECT
                      ? selectedLabels.has(opt.label)
                      : currentAnswer === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      disabled={answeringDisabled}
                      aria-pressed={isSelected}
                      onClick={() =>
                        currentQuestion.type === MULTI_SELECT
                          ? toggleMultiOption(opt.label)
                          : setAnswer(opt.label)
                      }
                      className={cn(
                        "flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all",
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500"
                          : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900",
                        answeringDisabled && "cursor-not-allowed opacity-60"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center border text-xs font-bold",
                          currentQuestion.type === MULTI_SELECT ? "rounded-md" : "rounded-full",
                          isSelected
                            ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                            : "border-zinc-700 bg-zinc-800 text-zinc-400"
                        )}
                      >
                        {opt.label}
                      </span>
                      <span className="text-sm sm:text-base">
                        <MathText>{opt.text}</MathText>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur py-3 px-2">
            <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearResponse}
                  disabled={!currentAnswer || answeringDisabled}
                  className="border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white text-xs"
                >
                  <RotateCcw className="mr-1.5 size-3" /> Clear Response
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markForReview}
                  className="border-purple-500/40 bg-purple-950/20 text-purple-300 hover:bg-purple-900/30 text-xs"
                >
                  <Bookmark className="mr-1.5 size-3" /> Mark for Review &amp; Next
                </Button>
                {sectionalEnabled && !currentSectionLocked && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sectionClocks.finishSection(activeSectionId)}
                    className="border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white text-xs"
                    title="End this section early and move on — you cannot come back"
                  >
                    <Lock className="mr-1.5 size-3" /> End section
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevQuestion}
                  disabled={activeQuestionIndex === 0}
                  className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-xs"
                >
                  <ChevronLeft className="mr-1 size-3.5" /> Previous
                </Button>
                <Button
                  size="sm"
                  onClick={saveAndNext}
                  className="bg-emerald-600 font-bold text-zinc-950 hover:bg-emerald-500 text-xs px-5"
                >
                  Save &amp; Next <ChevronRight className="ml-1 size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-80 shrink-0 border-l border-zinc-800 bg-zinc-900/40 p-4 flex flex-col justify-between overflow-y-auto hidden lg:flex">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Question Palette
            </h4>

            <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="size-4 rounded-sm bg-emerald-500 flex items-center justify-center text-[9px] font-bold text-zinc-950">
                  {summaryCounts.answered}
                </span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-4 rounded-sm bg-rose-500 flex items-center justify-center text-[9px] font-bold text-white">
                  {summaryCounts.notAnswered}
                </span>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-4 rounded-sm bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-300">
                  {summaryCounts.notVisited}
                </span>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-4 rounded-sm bg-purple-600 flex items-center justify-center text-[9px] font-bold text-white">
                  {summaryCounts.marked}
                </span>
                <span>Marked for Review</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <span className="size-4 rounded-sm bg-purple-600 flex items-center justify-center text-[9px] font-bold text-emerald-300 ring-1 ring-emerald-400">
                  {summaryCounts.answeredMarked}
                </span>
                <span>Answered &amp; Marked for Review</span>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-3">
              <span className="text-xs font-semibold text-zinc-400 mb-2 block">
                {simulation.sections.find((s) => s.id === activeSectionId)?.name} Questions:
              </span>
              <div className="grid grid-cols-5 gap-2">
                {sectionQuestions.map((q, idx) => {
                  const status = statuses[q.id] || "not_visited";
                  const isCurrent = idx === activeQuestionIndex;

                  let bgClass = "bg-zinc-800 text-zinc-400 hover:bg-zinc-700";
                  if (status === "answered") bgClass = "bg-emerald-500 text-zinc-950 font-bold";
                  else if (status === "not_answered") bgClass = "bg-rose-600 text-white font-semibold";
                  else if (status === "marked") bgClass = "bg-purple-600 text-white font-semibold";
                  else if (status === "answered_marked")
                    bgClass = "bg-purple-600 text-emerald-300 font-bold ring-2 ring-emerald-400";

                  return (
                    <button
                      key={q.id}
                      onClick={() => jumpToQuestion(activeSectionId, idx)}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-md text-xs font-mono transition-all",
                        bgClass,
                        isCurrent && "ring-2 ring-white scale-105 shadow-md",
                        currentSectionLocked && "opacity-50"
                      )}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4 mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-sm">
                {user.name ? user.name[0]?.toUpperCase() : "U"}
              </div>
              <div className="text-xs overflow-hidden">
                <p className="font-semibold text-white truncate">{user.name || "Candidate"}</p>
                <p className="text-zinc-400 truncate">{user.email}</p>
              </div>
            </div>

            <Button
              onClick={() => setShowSubmitModal(true)}
              className="w-full bg-emerald-600 font-bold text-zinc-950 hover:bg-emerald-500 text-xs"
            >
              Submit Final Examination
            </Button>
          </div>
        </aside>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-zinc-800 bg-zinc-950 text-white">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-bold">Submit Examination?</CardTitle>
              <p className="text-xs text-zinc-400">
                Are you sure you want to conclude and submit your test? Here is your answer summary:
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Answered:</span>
                  <span className="font-bold text-emerald-400">
                    {summaryCounts.answered + summaryCounts.answeredMarked}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Unanswered:</span>
                  <span className="font-bold text-rose-400">
                    {summaryCounts.notAnswered + summaryCounts.notVisited}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Marked for Review:</span>
                  <span className="font-bold text-purple-400">{summaryCounts.marked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Time Left:</span>
                  <span className="font-bold text-white">{formatClock(clock.remainingSec)}</span>
                </div>
              </div>

              {submitError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-left text-xs text-rose-300">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {submitError} Your answers are still here — stay on this page and
                    try again.
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                >
                  Resume Test
                </Button>
                <Button
                  onClick={handleSubmitTest}
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 font-bold text-zinc-950 hover:bg-emerald-500"
                >
                  {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {submitError ? "Try Again" : "Confirm Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showPaperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-4xl max-h-[85vh] flex flex-col border-zinc-800 bg-zinc-950 text-white">
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 pb-3">
              <CardTitle className="text-lg font-bold">Complete Question Paper</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPaperModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                Close
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
              {simulation.questions.map((q, i) => (
                <div key={q.id} className="border-b border-zinc-800/80 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-emerald-400">Q{i + 1}.</span>
                    <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">
                      {q.subject} · {q.chapter}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-200">
                    <MathText>{q.content}</MathText>
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
