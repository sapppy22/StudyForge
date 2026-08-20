"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { SimulationPlayer } from "@/components/simulations/simulation-player";
import { SimulationResult } from "@/components/simulations/simulation-result";
import {
  DEFAULT_PREFERENCES,
  resolveTestDuration,
  type TestPreferences,
} from "@/lib/test-timing";
import type { SimulationMock, SimulationAttemptResult } from "@/data/simulations/types";
import { Loader2 } from "lucide-react";

export default function SimulationRunnerPage() {
  const { simulationId } = useParams() as { simulationId: string };

  const [simulation, setSimulation] = useState<SimulationMock | null>(null);
  const [user, setUser] = useState<{ id: string; email: string; name?: string | null } | null>(null);
  const [preferences, setPreferences] = useState<TestPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<SimulationAttemptResult | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/simulations/${simulationId}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/auth/me")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/settings")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([simData, userData, prefsData]) => {
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
        console.error("Error loading simulation:", err);
      })
      .finally(() => setLoading(false));
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

  if (!simulation) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Simulation test paper not found.
      </div>
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
