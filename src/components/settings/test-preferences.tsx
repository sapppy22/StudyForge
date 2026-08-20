"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExamType, TestDurationMode } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXAM_CATALOG } from "@/data/exams/catalog";
import { EXAM_PATTERNS } from "@/data/simulations/patterns";
import { Loader2, Timer, X } from "lucide-react";

/**
 * The test-timing panel in Settings.
 *
 * Deliberately optimistic and self-saving: each control writes immediately and
 * rolls back on failure, because a "Save" button at the bottom of a page of
 * switches is the kind of thing people miss and then wonder why their exam ran
 * for three hours anyway.
 */

interface Preferences {
  testDurationMode: TestDurationMode;
  customTestMinutes: number;
  secondsPerQuestion: number;
  examDurations: Partial<Record<ExamType, number>>;
  quizTimerEnabled: boolean;
  quizSecondsPerQuestion: number;
  autoSubmitOnTimeUp: boolean;
  showTimer: boolean;
  warnAtMinutes: number;
  enforceSectionalTiming: boolean;
  proctoringEnabled: boolean;
  negativeMarkingEnabled: boolean;
}

const MODE_LABELS: Record<TestDurationMode, { label: string; hint: string }> = {
  official: {
    label: "Official exam duration",
    hint: "Each mock runs exactly as long as the real paper — 180 minutes for JEE Main, 60 for SSC CGL.",
  },
  custom: {
    label: "Fixed length",
    hint: "Every mock runs for the same number of minutes, whatever the paper.",
  },
  per_question: {
    label: "Budget per question",
    hint: "The clock is the question count times your per-question budget, so a short paper gets a short clock.",
  },
};

const MOCKABLE_EXAMS = EXAM_CATALOG.filter((e) => e.examType !== ExamType.CUSTOM);

export function TestPreferences() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [overrideExam, setOverrideExam] = useState<string>("");
  const [overrideMinutes, setOverrideMinutes] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setPrefs(data))
      .catch(() => toast.error("Couldn't load your preferences"))
      .finally(() => setLoading(false));
  }, []);

  async function update(patch: Partial<Preferences>) {
    if (!prefs) return;
    const previous = prefs;
    setPrefs({ ...prefs, ...patch });
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      setPrefs(await res.json());
    } catch {
      setPrefs(previous);
      toast.error("Couldn't save that. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const overrides = useMemo(
    () => Object.entries(prefs?.examDurations ?? {}) as [ExamType, number][],
    [prefs]
  );

  function addOverride() {
    const minutes = Number(overrideMinutes);
    if (!overrideExam || !Number.isFinite(minutes) || minutes < 1) return;
    void update({
      examDurations: { ...prefs?.examDurations, [overrideExam]: Math.round(minutes) },
    });
    setOverrideExam("");
    setOverrideMinutes("");
  }

  function removeOverride(examType: ExamType) {
    const next = { ...prefs?.examDurations };
    delete next[examType];
    void update({ examDurations: next });
  }

  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!prefs) {
    return (
      <p className="text-sm text-muted-foreground">
        Your preferences couldn&apos;t be loaded. Reload the page to try again.
      </p>
    );
  }

  return (
    <div className={cn("space-y-6", saving && "opacity-90")}>
      {/* How long a mock runs */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="duration-mode">How long should a full mock run?</Label>
          <Select
            value={prefs.testDurationMode}
            onValueChange={(v) =>
              v && update({ testDurationMode: v as TestDurationMode })
            }
          >
            <SelectTrigger id="duration-mode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MODE_LABELS).map(([value, meta]) => (
                <SelectItem key={value} value={value}>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {MODE_LABELS[prefs.testDurationMode].hint}
          </p>
        </div>

        {prefs.testDurationMode === TestDurationMode.custom && (
          <div className="space-y-1.5">
            <Label htmlFor="custom-minutes">Minutes per mock</Label>
            <Input
              id="custom-minutes"
              type="number"
              min={1}
              max={600}
              className="w-40"
              value={prefs.customTestMinutes}
              onChange={(e) =>
                setPrefs({ ...prefs, customTestMinutes: Number(e.target.value) })
              }
              onBlur={(e) => update({ customTestMinutes: Number(e.target.value) })}
            />
          </div>
        )}

        {prefs.testDurationMode === TestDurationMode.per_question && (
          <div className="space-y-1.5">
            <Label htmlFor="seconds-per-question">Seconds per question</Label>
            <Input
              id="seconds-per-question"
              type="number"
              min={10}
              max={900}
              className="w-40"
              value={prefs.secondsPerQuestion}
              onChange={(e) =>
                setPrefs({ ...prefs, secondsPerQuestion: Number(e.target.value) })
              }
              onBlur={(e) => update({ secondsPerQuestion: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              JEE Main allows about 144 seconds a question; SSC CGL about 36.
            </p>
          </div>
        )}
      </div>

      {/* Per-exam overrides */}
      <div className="space-y-2 border-t pt-5">
        <Label>Per-exam overrides</Label>
        <p className="text-xs text-muted-foreground">
          Pin one exam to a specific length. An override always wins over the
          setting above.
        </p>

        {overrides.length > 0 && (
          <ul className="space-y-1.5 pt-1">
            {overrides.map(([examType, minutes]) => {
              const entry = MOCKABLE_EXAMS.find((e) => e.examType === examType);
              const official = EXAM_PATTERNS[examType]?.durationMinutes;
              return (
                <li
                  key={examType}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">{entry?.label ?? examType}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      — {minutes} min
                      {official ? ` (official ${official})` : ""}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove the ${entry?.label ?? examType} override`}
                    onClick={() => removeOverride(examType)}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-end gap-2 pt-1">
          <Select value={overrideExam} onValueChange={(v) => setOverrideExam(v ?? "")}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Choose an exam" />
            </SelectTrigger>
            <SelectContent>
              {MOCKABLE_EXAMS.map((entry) => (
                <SelectItem key={entry.examType} value={entry.examType}>
                  {entry.label} ({EXAM_PATTERNS[entry.examType]?.durationMinutes} min)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={1}
            max={600}
            placeholder="Minutes"
            className="w-28"
            aria-label="Override duration in minutes"
            value={overrideMinutes}
            onChange={(e) => setOverrideMinutes(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={addOverride}
            disabled={!overrideExam || !overrideMinutes}
          >
            Add override
          </Button>
        </div>
      </div>

      {/* Quiz timer */}
      <div className="space-y-3 border-t pt-5">
        <ToggleRow
          id="quiz-timer"
          label="Time topic quizzes too"
          hint="Practice quizzes get a clock budgeted from their question count."
          checked={prefs.quizTimerEnabled}
          onChange={(v) => update({ quizTimerEnabled: v })}
        />
        {prefs.quizTimerEnabled && (
          <div className="space-y-1.5 pl-1">
            <Label htmlFor="quiz-seconds">Seconds per quiz question</Label>
            <Input
              id="quiz-seconds"
              type="number"
              min={10}
              max={900}
              className="w-40"
              value={prefs.quizSecondsPerQuestion}
              onChange={(e) =>
                setPrefs({ ...prefs, quizSecondsPerQuestion: Number(e.target.value) })
              }
              onBlur={(e) => update({ quizSecondsPerQuestion: Number(e.target.value) })}
            />
          </div>
        )}
      </div>

      {/* Clock behaviour */}
      <div className="space-y-3 border-t pt-5">
        <ToggleRow
          id="show-timer"
          label="Show the countdown"
          hint="Hide it to practise pacing by feel; the clock still runs."
          checked={prefs.showTimer}
          onChange={(v) => update({ showTimer: v })}
        />
        <ToggleRow
          id="auto-submit"
          label="Submit automatically at zero"
          hint="What the real CBT does. Turn it off and you keep answering past the bell."
          checked={prefs.autoSubmitOnTimeUp}
          onChange={(v) => update({ autoSubmitOnTimeUp: v })}
        />
        <ToggleRow
          id="sectional"
          label="Enforce sectional time limits"
          hint="CAT, CUET, IBPS PO and the language tests lock each section when its own clock runs out."
          checked={prefs.enforceSectionalTiming}
          onChange={(v) => update({ enforceSectionalTiming: v })}
        />
        <div className="space-y-1.5">
          <Label htmlFor="warn-at">Warn me at (minutes remaining)</Label>
          <Input
            id="warn-at"
            type="number"
            min={0}
            max={60}
            className="w-40"
            value={prefs.warnAtMinutes}
            onChange={(e) => setPrefs({ ...prefs, warnAtMinutes: Number(e.target.value) })}
            onBlur={(e) => update({ warnAtMinutes: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Exam conditions */}
      <div className="space-y-3 border-t pt-5">
        <ToggleRow
          id="proctoring"
          label="Proctoring during mocks"
          hint="Flags tab switches and window blur, and submits after three violations."
          checked={prefs.proctoringEnabled}
          onChange={(v) => update({ proctoringEnabled: v })}
        />
        <ToggleRow
          id="negative-marking"
          label="Negative marking"
          hint="Off scores wrong answers as zero instead of deducting — useful when drilling a new topic."
          checked={prefs.negativeMarkingEnabled}
          onChange={(v) => update({ negativeMarkingEnabled: v })}
        />
      </div>

      <p className="flex items-center gap-1.5 border-t pt-4 text-xs text-muted-foreground">
        {saving ? (
          <>
            <Loader2 className="size-3.5 animate-spin" /> Saving…
          </>
        ) : (
          <>
            <Timer className="size-3.5" /> Changes apply to the next test you start.
          </>
        )}
      </p>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-0.5" />
    </div>
  );
}
