import * as z from "zod";
import { ExamType } from "@prisma/client";
import { readJson, withUser } from "@/lib/api";
import { createGoal, getGoalsByUser } from "@/services/goals/goalService";

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  examType: z.enum(ExamType),
  // Accepted as a date-only or full ISO string; createGoal does the parsing.
  examDate: z.iso.date().or(z.iso.datetime()).optional(),
  dailyStudyMinutes: z.number().int().min(10).max(1440).optional(),
});

export const GET = withUser(async ({ user }) => getGoalsByUser(user.id));

export const POST = withUser(async ({ request, user }) => {
  const body = await readJson(request, CreateSchema);
  return createGoal({ ...body, userId: user.id });
});
