"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SimulationPlayer } from "@/components/simulations/simulation-player";
import { SimulationResult } from "@/components/simulations/simulation-result";
import type { SimulationMock, SimulationAttemptResult } from "@/data/simulations/types";
import { Loader2 } from "lucide-react";

export default function SimulationRunnerPage() {
  const { simulationId } = useParams() as { simulationId: string };

  const [simulation, setSimulation] = useState<SimulationMock | null>(null);
  const [user, setUser] = useState<{ id: string; email: string; name?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<SimulationAttemptResult | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/simulations/${simulationId}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/auth/me")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([simData, userData]) => {
        setSimulation(simData);
        setUser(
          userData?.user || {
            id: "guest-user",
            email: "student@studyforge.app",
            name: "Candidate",
          }
        );
      })
      .catch((err) => {
        console.error("Error loading simulation:", err);
      })
      .finally(() => setLoading(false));
  }, [simulationId]);

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
      onComplete={(res) => {
        setResult(res);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    />
  );
}
