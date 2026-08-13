"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AlertTriangle, ShieldAlert, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProctoringViolation } from "@/data/simulations/types";

interface ProctoringGuardProps {
  active: boolean;
  maxViolations?: number;
  onViolation: (violation: ProctoringViolation) => void;
  onMaxViolationsExceeded: () => void;
  violations: ProctoringViolation[];
}

export function ProctoringGuard({
  active,
  maxViolations = 3,
  onViolation,
  onMaxViolationsExceeded,
  violations,
}: ProctoringGuardProps) {
  const [warningOpen, setWarningOpen] = useState(false);
  const [currentWarningMsg, setCurrentWarningMsg] = useState("");
  const isHandlingViolationRef = useRef(false);

  // Play synthesized audio warning beep using Web Audio API
  const playAlertSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio context might be restricted by browser policy before user interaction
    }
  }, []);

  const triggerViolation = useCallback(
    (type: ProctoringViolation["type"], details: string) => {
      if (!active || isHandlingViolationRef.current) return;
      isHandlingViolationRef.current = true;

      const violation: ProctoringViolation = {
        timestamp: new Date().toISOString(),
        type,
        details,
      };

      playAlertSound();
      setCurrentWarningMsg(details);
      setWarningOpen(true);
      onViolation(violation);

      const totalCount = violations.length + 1;
      if (totalCount >= maxViolations) {
        setTimeout(() => {
          onMaxViolationsExceeded();
        }, 1500);
      }
    },
    [active, maxViolations, onViolation, onMaxViolationsExceeded, playAlertSound, violations.length]
  );

  useEffect(() => {
    if (!active) return;

    // 1. Visibility change listener (tab switch / minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerViolation(
          "tab_switch",
          "Tab switch or window minimization detected. You must stay on the exam screen."
        );
      }
    };

    // 2. Window blur listener (app switch / focus loss)
    const handleWindowBlur = () => {
      triggerViolation(
        "window_blur",
        "Application switch detected. Browser lost focus to another app or background window."
      );
    };

    // 3. Fullscreen exit listener
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerViolation(
          "fullscreen_exit",
          "Fullscreen mode was exited. The exam requires continuous fullscreen."
        );
      }
    };

    // 4. Block inspect / keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 or Ctrl+Shift+I or Cmd+Option+I (DevTools)
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
        ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U"))
      ) {
        e.preventDefault();
        triggerViolation("shortcut_blocked", "Developer tools / shortcut inspection blocked.");
      }
    };

    // 5. Block right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [active, triggerViolation]);

  async function resumeExam() {
    isHandlingViolationRef.current = false;
    setWarningOpen(false);

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Browser may require user gesture
    }
  }

  if (!warningOpen) return null;

  const currentCount = violations.length;
  const isTerminal = currentCount >= maxViolations;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border-2 border-rose-500/60 bg-zinc-950 p-6 text-center shadow-2xl shadow-rose-950/50">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 ring-8 ring-rose-500/10">
          <ShieldAlert className="size-8 animate-pulse" />
        </div>

        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-400">
          <AlertTriangle className="size-3.5" />
          Anti-Cheat Proctoring Alert
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white">
          {isTerminal ? "Disqualification Threshold Reached" : "Warning: App / Tab Switch Detected"}
        </h2>

        <p className="mt-2 text-sm text-zinc-300">
          {currentWarningMsg}
        </p>

        <div className="my-4 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Violations Recorded</span>
            <span className="font-semibold text-rose-400">
              {currentCount} of {maxViolations} Allowed
            </span>
          </div>
          <div className="mt-2 flex gap-1.5">
            {Array.from({ length: maxViolations }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i < currentCount ? "bg-rose-500 shadow-sm shadow-rose-500/50" : "bg-zinc-800"
                }`}
              />
            ))}
          </div>
        </div>

        {isTerminal ? (
          <div className="space-y-2">
            <p className="text-xs text-rose-400 font-medium">
              Maximum allowed infractions exceeded. Auto-submitting exam with proctoring flag...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">
              Leaving the exam window or switching applications is strictly logged. Further violations will result in immediate auto-submission.
            </p>
            <Button
              onClick={resumeExam}
              className="w-full bg-rose-600 font-semibold text-white hover:bg-rose-500"
            >
              <Maximize className="mr-2 size-4" />
              Return to Exam (Resume Fullscreen)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
