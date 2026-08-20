"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { SimulationPlayer } from "@/components/simulations/simulation-player";
import { SimulationResult } from "@/components/simulations/simulation-result";
import {
  DEFAULT_PREFERENCES,
  resolveTestDuration,
  type TestPreferences,
} from "@/lib/test-timing";
import type { SimulationMock, SimulationAttemptResult } from "@/data/simulations/types";
import { Loader2, TriangleAlert } from "lucide-react";

export default function SimulationRunnerPage() {
  const { simulationId } = useParams() as { simulationId: string };

  const [simulation, setSimulation] = useState<SimulationMock | null>(null);
  const [user, setUser] = useState<{ id: string; email: string; name?: string | null } | null>(null);
  const [preferences, setPreferences] = useState<TestPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationAttemptResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPaper() {
      const res = await fetch(`/api/simulations/${simulationId}`);
      if (res.ok) return res.json();
      // 404 is the only answer that actually means "no such paper". A 401 or a
      // 503 was being shown as one too, so a signed-out session or an
      // unreachable database read to the student as a paper that had vanished.
      const body = await res.json().catch(() => ({}));
      throw new Error(
        res.status === 404
          ? "This simulation paper doesn't exist, or isn't yours."
          : (body.error ?? "The paper couldn't be loaded. Try again shortly.")
      );
    }

    Promise.all([
      loadPaper(),
      fetch("/api/auth/me")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      // Settings are a preference, not a prerequisite: if they can't be read
      // the paper still runs on the board's own clock.
      fetch("/api/settings")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([simData, userData, prefsData]) => {
        if (cancelled) return;
        setSimulation(simData);
        if (prefsData) setPreferences(prefsData);
        // The candidate panel mimics a real CBT hall ticket, so it always needs
        // a line under the name — guests have no address to put there.
        const me = userData?.user;
        setUser({
          id: me?.id ?? "candidate",
          email: me?.email ?? "Guest session",
          name: me?.name ?? "Candidate",
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error loading simulation:", err);
        setLoadError(
          err instanceof Error ? err.message : "The paper couldn't be loaded."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [simulationId]);

  // The paper declares the board's duration; the student's settings decide
  // what the clock in front of them actually shows.
  const durationMinutes = useMemo(() => {
    if (!simulation) return 0;
    return resolveTestDuration({
      preferences,
      examType: simulation.examType,
      questionCount: simulation.questions.length,
      officialMinutes: simulation.durationMinutes,
    }).minutes;
  }, [simulation, preferences]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (loadError || !simulation) {
    return (
      <EmptyState
        icon={TriangleAlert}
        title="This paper couldn't be opened"
        description={loadError ?? "Simulation test paper not found."}
        className="h-[60vh]"
      >
        <Link
          href="/simulations"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to simulations
        </Link>
      </EmptyState>
    );
  }

  if (result) {
    return (
      <SimulationResult
        result={result}
        onRetake={() => {
          setResult(null);
          window.location.reload();
        }}
      />
    );
  }

  return (
    <SimulationPlayer
      simulation={simulation}
      user={user || { id: "candidate", email: "candidate@studyforge.app" }}
      durationMinutes={durationMinutes}
      preferences={preferences}
      onComplete={(res) => {
        setResult(res);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    />
  );
}
