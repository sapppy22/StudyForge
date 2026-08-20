import { ExamType } from "@prisma/client";
import type { ExamPatternConfig, SimulationMock } from "./types";
import { EXAM_PATTERNS } from "./patterns";
import { CURATED_SIMULATIONS } from "./mocks";

export * from "./types";
export * from "./patterns";
export * from "./mocks";

const withOrigin = (sim: SimulationMock): SimulationMock => ({
  ...sim,
  origin: "curated",
});

export function getAllSimulations(): SimulationMock[] {
  return CURATED_SIMULATIONS.map(withOrigin);
}

export function getSimulationById(idOrSlug: string): SimulationMock | undefined {
  const found = CURATED_SIMULATIONS.find(
    (s) => s.id === idOrSlug || s.slug === idOrSlug
  );
  return found ? withOrigin(found) : undefined;
}

export function getSimulationsForExam(examType: ExamType): SimulationMock[] {
  return CURATED_SIMULATIONS.filter((s) => s.examType === examType).map(withOrigin);
}

export function getPatternForExam(examType: ExamType): ExamPatternConfig {
  return EXAM_PATTERNS[examType] || EXAM_PATTERNS[ExamType.JEE_MAIN];
}
