import * as z from "zod";
import { ExamType, TestDurationMode } from "@prisma/client";
import { readJson, withUser } from "@/lib/api";
import { getPreferences, savePreferences } from "@/services/settings/settingsService";

const UpdateSchema = z.object({
  testDurationMode: z.enum(TestDurationMode).optional(),
  customTestMinutes: z.number().int().min(1).max(600).optional(),
  secondsPerQuestion: z.number().int().min(10).max(900).optional(),
  // Per-exam overrides; a null value clears that exam's override.
  examDurations: z
    .record(z.enum(ExamType), z.number().int().min(1).max(600))
    .optional(),
  quizTimerEnabled: z.boolean().optional(),
  quizSecondsPerQuestion: z.number().int().min(10).max(900).optional(),
  autoSubmitOnTimeUp: z.boolean().optional(),
  showTimer: z.boolean().optional(),
  warnAtMinutes: z.number().int().min(0).max(60).optional(),
  enforceSectionalTiming: z.boolean().optional(),
  proctoringEnabled: z.boolean().optional(),
  negativeMarkingEnabled: z.boolean().optional(),
});

export const GET = withUser(async ({ user }) => getPreferences(user.id));

export const PATCH = withUser(async ({ request, user }) => {
  const body = await readJson(request, UpdateSchema);
  return savePreferences(user.id, body);
});
