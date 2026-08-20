"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProctoringGuard } from "./proctoring-guard";
import { MathText } from "@/components/shared/math-text";
import type {
  SimulationMock,
  SimulationAttemptResult,
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
  Loader2,
} from "lucide-react";

interface SimulationPlayerProps {
  simulation: SimulationMock;
  user: { id: string; email: string; name?: string | null };
  onComplete: (result: SimulationAttemptResult) => void;
}

type QuestionStatus = "not_visited" | "not_answered" | "answered" | "marked" | "answered_marked";

export function SimulationPlayer({
  simulation,
  user,
  onComplete,
}: SimulationPlayerProps) {

  // Active state
  const [activeSectionId, setActiveSectionId] = useState(simulation.sections[0]?.id || "");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Response tracking: map questionId -> response string
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Status tracking: map questionId -> QuestionStatus (lazy initial state)
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
  // Time spent per question: map questionId -> seconds
  const [questionTimeMap, setQuestionTimeMap] = useState<Record<string, number>>({});

  // Proctoring violations
  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  const [proctoringActive, setProctoringActive] = useState(false);

  // Overall timer (countdown in seconds)
  const totalSeconds = simulation.durationMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaperModal, setShowPaperModal] = useState(false);

  // Questions in current active section
  const sectionQuestions = useMemo(() => {
    return simulation.questions.filter((q) => q.sectionId === activeSectionId);
  }, [simulation.questions, activeSectionId]);

  const currentQuestion = sectionQuestions[activeQuestionIndex] || simulation.questions[0];

  // Start exam & request fullscreen
  const startExam = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // ignore
    }
    setProctoringActive(true);
  }, []);

  // Format seconds to HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Submit test
  const handleSubmitTest = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const totalTimeSpent = totalSeconds - timeLeft;

    const payload = {
      answers: Object.entries(answers).map(([questionId, response]) => ({
        questionId,
        response,
        timeSpentSec: questionTimeMap[questionId] || 0,
      })),
      timeSpentSec: totalTimeSpent,
      proctoringViolations: violations,
    };

    try {
      const res = await fetch(`/api/simulations/${simulation.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Submission failed");
      }

      const result: SimulationAttemptResult = await res.json();

      // Exit fullscreen
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }

      onComplete(result);
    } catch (err) {
      console.error("Failed to submit simulation:", err);
      setIsSubmitting(false);
    }
  }, [isSubmitting, totalSeconds, timeLeft, answers, questionTimeMap, violations, simulation.id, onComplete]);

  const submitRef = useRef(handleSubmitTest);

  useEffect(() => {
    submitRef.current = handleSubmitTest;
  }, [handleSubmitTest]);

  // Main countdown timer
  useEffect(() => {
    if (!proctoringActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitRef.current();
          return 0;
        }
        return prev - 1;
      });

      // Track time on active question
      if (currentQuestion) {
        setQuestionTimeMap((prev) => ({
          ...prev,
          [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1,
        }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [proctoringActive, currentQuestion]);

  // Actions on current question
  const selectOption = (optLabel: string) => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: optLabel };
    setAnswers(newAnswers);
    setStatuses((prev) => ({
      ...prev,
      [currentQuestion.id]: prev[currentQuestion.id] === "marked" ? "answered_marked" : "answered",
    }));
  };

  const handleNumericalInput = (val: string) => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: val };
    setAnswers(newAnswers);
    setStatuses((prev) => ({
      ...prev,
      [currentQuestion.id]: val.trim().length > 0 ? "answered" : "not_answered",
    }));
  };

  const clearResponse = () => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestion.id];
    setAnswers(newAnswers);
    setStatuses((prev) => ({
      ...prev,
      [currentQuestion.id]: "not_answered",
    }));
  };

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

  const goToNextQuestion = () => {
    if (activeQuestionIndex < sectionQuestions.length - 1) {
      const nextQ = sectionQuestions[activeQuestionIndex + 1];
      setActiveQuestionIndex(activeQuestionIndex + 1);
      if (statuses[nextQ.id] === "not_visited") {
        setStatuses((prev) => ({ ...prev, [nextQ.id]: "not_answered" }));
      }
    } else {
      // Find next section if available
      const currentSecIdx = simulation.sections.findIndex((s) => s.id === activeSectionId);
      if (currentSecIdx < simulation.sections.length - 1) {
        const nextSec = simulation.sections[currentSecIdx + 1];
        setActiveSectionId(nextSec.id);
        setActiveQuestionIndex(0);
      }
    }
  };

  const goToPrevQuestion = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex(activeQuestionIndex - 1);
    }
  };

  const jumpToQuestion = (secId: string, qIndex: number) => {
    setActiveSectionId(secId);
    setActiveQuestionIndex(qIndex);
    const targetQ = simulation.questions.filter((q) => q.sectionId === secId)[qIndex];
    if (targetQ && statuses[targetQ.id] === "not_visited") {
      setStatuses((prev) => ({ ...prev, [targetQ.id]: "not_answered" }));
    }
  };

  // Palette counts summary
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

  // If exam has not started, show Pre-Exam Instructions screen
  if (!proctoringActive) {
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
            <p className="text-sm text-zinc-400">
              {simulation.description}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
              <div>
                <span className="text-xs text-zinc-400 uppercase">Duration</span>
                <p className="text-lg font-bold text-white">{simulation.durationMinutes} Mins</p>
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
              <h3 className="text-sm font-semibold text-white">Official CBT Examination Instructions:</h3>
              <ul className="space-y-2 text-sm text-zinc-300">
                {simulation.instructions.map((inst, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-4 text-sm text-rose-300">
              <div className="flex items-center gap-2 font-semibold text-rose-400 mb-1">
                <AlertCircle className="size-4" />
                Anti-Cheat Proctoring Protocol Active
              </div>
              <p className="text-xs text-rose-300/80">
                This test will launch in full screen. Any application switch, tab navigation, or window minimizing will be recorded as a violation. 3 violations will trigger automatic disqualification and submission.
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={startExam}
                size="lg"
                className="w-full bg-emerald-600 font-bold text-zinc-950 hover:bg-emerald-500"
              >
                <Maximize2 className="mr-2 size-5" />
                I am Ready — Start Proctored Exam (Enter Fullscreen)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active CBT Exam Interface
  const currentAnswer = answers[currentQuestion?.id] || "";
  const isTimeLow = timeLeft < 300; // less than 5 minutes

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-zinc-950 text-zinc-100 select-none overflow-hidden">
      {/* Proctoring Guard Hook */}
      <ProctoringGuard
        active={proctoringActive}
        maxViolations={3}
        violations={violations}
        onViolation={(v) => setViolations((prev) => [...prev, v])}
        onMaxViolationsExceeded={handleSubmitTest}
      />

      {/* CBT Top Bar */}
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
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-xs">
            <ShieldCheck className="mr-1 size-3" /> Proctored Mode
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          {/* Time Remaining Clock */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1 font-mono text-base font-bold tabular-nums border",
              isTimeLow
                ? "border-rose-500/50 bg-rose-950/40 text-rose-400 animate-pulse"
                : "border-zinc-700 bg-zinc-800/80 text-emerald-400"
            )}
          >
            <Clock className="size-4" />
            <span>Time Left: {formatTime(timeLeft)}</span>
          </div>

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

      {/* Section Selector Navigation Tabs */}
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-zinc-800 bg-zinc-900/60 px-4 overflow-x-auto">
        <span className="text-xs font-semibold text-zinc-400 mr-2 uppercase tracking-wider">Sections:</span>
        {simulation.sections.map((sec) => {
          const isActive = sec.id === activeSectionId;
          const count = simulation.questions.filter((q) => q.sectionId === sec.id).length;
          const answeredInSec = simulation.questions.filter(
            (q) => q.sectionId === sec.id && answers[q.id]
          ).length;

          return (
            <button
              key={sec.id}
              onClick={() => {
                setActiveSectionId(sec.id);
                setActiveQuestionIndex(0);
              }}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm"
                  : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <span>{sec.name}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px]",
                  isActive ? "bg-zinc-950 text-emerald-400" : "bg-zinc-700 text-zinc-300"
                )}
              >
                {answeredInSec}/{count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Examination Viewport (Left Question Area + Right Question Palette) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Active Question Area */}
        <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            {/* Question Header & Marking Scheme */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">
                  Question {activeQuestionIndex + 1}
                </span>
                <span className="text-xs text-zinc-400">
                  (of {sectionQuestions.length} in {simulation.sections.find((s) => s.id === activeSectionId)?.name})
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                  +{currentQuestion?.marks || 4} Marks
                </Badge>
                <Badge variant="outline" className="border-rose-500/30 text-rose-400 bg-rose-500/10">
                  -{currentQuestion?.negativeMarks || 1} Negative
                </Badge>
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                  {currentQuestion?.type === "numeric" ? "Numerical Input" : "Single Choice"}
                </Badge>
              </div>
            </div>

            {/* Question Statement */}
            <div className="text-base sm:text-lg leading-relaxed text-zinc-100 font-normal py-2 font-sans">
              <MathText>{currentQuestion?.content}</MathText>
            </div>

            {/* Options (MCQ) or Numerical Input */}
            {currentQuestion?.type === "numeric" ? (
              <div className="my-6 max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Enter Your Numerical Answer:
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 24 or 3.14"
                  value={currentAnswer}
                  onChange={(e) => handleNumericalInput(e.target.value)}
                  className="font-mono text-lg font-bold border-zinc-700 bg-zinc-950 text-emerald-400 focus-visible:ring-emerald-500"
                />
                <p className="text-[11px] text-zinc-500">
                  Enter integer or decimal value. Round off to 2 decimal places if needed.
                </p>
              </div>
            ) : (
              <div className="space-y-3 my-4">
                {currentQuestion?.options?.map((opt) => {
                  const isSelected = currentAnswer === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => selectOption(opt.label)}
                      className={cn(
                        "flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all",
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500"
                          : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
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

          {/* Action Bar */}
          <div className="sticky bottom-0 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur py-3 px-2">
            <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearResponse}
                  disabled={!currentAnswer}
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
                  <Bookmark className="mr-1.5 size-3" /> Mark for Review & Next
                </Button>
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
                  Save & Next <ChevronRight className="ml-1 size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: TCS/NTA Official Question Palette */}
        <aside className="w-80 shrink-0 border-l border-zinc-800 bg-zinc-900/40 p-4 flex flex-col justify-between overflow-y-auto hidden lg:flex">
          <div>
            {/* Palette Legend */}
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
                <span>Answered & Marked for Review</span>
              </div>
            </div>

            {/* Questions Grid for Active Section */}
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
                  else if (status === "answered_marked") bgClass = "bg-purple-600 text-emerald-300 font-bold ring-2 ring-emerald-400";

                  return (
                    <button
                      key={q.id}
                      onClick={() => jumpToQuestion(activeSectionId, idx)}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-md text-xs font-mono transition-all",
                        bgClass,
                        isCurrent && "ring-2 ring-white scale-105 shadow-md"
                      )}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Candidate Info & Quick Submit */}
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

      {/* Submit Confirmation Modal */}
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
                  <span className="font-bold text-emerald-400">{summaryCounts.answered + summaryCounts.answeredMarked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Unanswered:</span>
                  <span className="font-bold text-rose-400">{summaryCounts.notAnswered + summaryCounts.notVisited}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Marked for Review:</span>
                  <span className="font-bold text-purple-400">{summaryCounts.marked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Time Left:</span>
                  <span className="font-bold text-white">{formatTime(timeLeft)}</span>
                </div>
              </div>

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
                  Confirm Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Question Paper Overview Drawer/Modal */}
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
