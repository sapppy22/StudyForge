import { ExamType, QuestionType } from "@prisma/client";
import { getSimulationById, getAllSimulations, getSimulationsForExam } from "@/data/simulations";
import type {
  SimulationMock,
  SimulationQuestion,
  SimulationAttemptResult,
  ProctoringViolation,
} from "@/data/simulations/types";
import { getGeneratedPaper, listGeneratedPapers } from "./paperService";
import { gradeSubjective } from "@/services/ai/grading";
import {
  DEFAULT_PREFERENCES,
  getPreferences,
  type TestPreferences,
} from "@/services/settings/settingsService";
import { sendExamScorecardEmail } from "@/services/email/emailService";
import { APP_URL } from "@/lib/env";
import { isDatabaseUnavailable, NotFoundError } from "@/lib/errors";

export interface SimulationSubmissionInput {
  simulationId: string;
  userId: string;
  userEmail: string;
  userName?: string | null;
  answers: { questionId: string; response: string; timeSpentSec?: number }[];
  timeSpentSec: number;
  proctoringViolations: ProctoringViolation[];
}

/**
 * The library: the curated sample papers plus every full-length paper this user
 * has generated. Generated ones come first — they are the real simulations.
 */
export async function listAvailableSimulations(
  userId: string,
  examType?: ExamType
): Promise<SimulationMock[]> {
  const curated = examType ? getSimulationsForExam(examType) : getAllSimulations();

  // The curated papers are static data — they need nothing from the database —
  // so a database failure must not take the whole library down with them.
  // It used to: one rejected query answered the route with a 503, the library
  // rendered its "no papers for this exam yet" empty state, and there was
  // nothing left to launch even though every curated paper was sitting right
  // there. Losing the generated papers is a degraded library; losing all of
  // them is a broken screen.
  let generated: SimulationMock[] = [];
  try {
    generated = await listGeneratedPapers(userId, examType);
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    console.error("[simulations] generated papers unavailable:", error);
  }

  return [...generated, ...curated];
}

/** Resolves a curated paper by slug, or one of this user's generated papers. */
export async function getSimulationDetails(
  idOrSlug: string,
  userId: string
): Promise<SimulationMock | null> {
  return getSimulationById(idOrSlug) ?? (await getGeneratedPaper(idOrSlug, userId));
}

/* -------------------------------------------------------------------------- */
/*  Grading                                                                    */
/* -------------------------------------------------------------------------- */

interface Marked {
  score: number;
  isCorrect: boolean;
  /** Set when the answer earned something without being fully right. */
  partial?: boolean;
}

const normalizeText = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.,;:!?]+$/, "");

/**
 * Numerical answers are marked to a tolerance rather than by string equality:
 * a paper that asks you to round to two decimals must accept 3.14 for 3.1416,
 * and must not reject "12.0" for "12".
 */
function markNumeric(expected: string, actual: string): boolean {
  const expectedNum = Number.parseFloat(expected);
  const actualNum = Number.parseFloat(actual);
  if (Number.isNaN(expectedNum) || Number.isNaN(actualNum)) {
    return normalizeText(expected) === normalizeText(actual);
  }
  const tolerance = Math.max(0.01, Math.abs(expectedNum) * 0.005);
  return Math.abs(expectedNum - actualNum) <= tolerance;
}

const labelSet = (value: string) =>
  new Set(
    value
      .split(",")
      .map((part) => part.trim().toUpperCase())
      .filter(Boolean)
  );

/**
 * Multi-select marking, following JEE Advanced: every correct option and
 * nothing else scores full marks; a non-empty subset of the correct options
 * scores partial credit; any incorrect option scores the negative.
 */
function markMultiSelect(
  question: SimulationQuestion,
  response: string,
  negativeEnabled: boolean
): Marked {
  const expected = labelSet(question.correctAnswer);
  const chosen = labelSet(response);
  const wrong = Array.from(chosen).filter((label) => !expected.has(label));

  if (wrong.length > 0) {
    return {
      score: negativeEnabled ? -question.negativeMarks : 0,
      isCorrect: false,
    };
  }

  if (chosen.size === expected.size) {
    return { score: question.marks, isCorrect: true };
  }

  // One mark per correct option darkened, which is the published partial rule.
  return { score: Math.max(0, chosen.size), isCorrect: false, partial: chosen.size > 0 };
}

async function markQuestion(
  question: SimulationQuestion,
  response: string,
  negativeEnabled: boolean
): Promise<Marked & { feedback?: string }> {
  const answered = response.trim().length > 0;
  if (!answered) return { score: 0, isCorrect: false };

  switch (question.type) {
    case QuestionType.msq:
      return markMultiSelect(question, response, negativeEnabled);

    case QuestionType.numeric: {
      const correct = markNumeric(question.correctAnswer, response);
      return {
        score: correct ? question.marks : negativeEnabled ? -question.negativeMarks : 0,
        isCorrect: correct,
      };
    }

    case QuestionType.short_answer: {
      // Most short answers on these papers are a word or a value, so an exact
      // match settles it without a model call. Only the rest go to the grader.
      if (normalizeText(question.correctAnswer) === normalizeText(response)) {
        return { score: question.marks, isCorrect: true };
      }
      const graded = await gradeSubjective({
        question: question.content,
        modelAnswer: question.correctAnswer,
        response,
        maxScore: question.marks,
      });
      return {
        score: graded.score,
        isCorrect: graded.isCorrect === true,
        partial: graded.score > 0 && graded.score < question.marks,
        feedback: graded.feedback,
      };
    }

    case QuestionType.long_answer: {
      const graded = await gradeSubjective({
        question: question.content,
        modelAnswer: question.correctAnswer,
        response,
        maxScore: question.marks,
      });
      return {
        score: graded.score,
        isCorrect: graded.isCorrect === true,
        partial: graded.score > 0 && graded.score < question.marks,
        feedback: graded.feedback,
      };
    }

    default: {
      const correct =
        normalizeText(question.correctAnswer) === normalizeText(response);
      return {
        score: correct ? question.marks : negativeEnabled ? -question.negativeMarks : 0,
        isCorrect: correct,
      };
    }
  }
}

/**
 * The preferences grading needs, with the defaults standing in when they can't
 * be read.
 *
 * A curated paper is scored entirely from static data, so an unreachable
 * database is no reason to reject a submission — and rejecting it costs the
 * student the whole sitting, because the answers only ever existed in the
 * browser. Marking to the default scheme is the far smaller error.
 */
async function preferencesForGrading(userId: string): Promise<TestPreferences> {
  try {
    return await getPreferences(userId);
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    console.error("[simulations] grading with default preferences:", error);
    return DEFAULT_PREFERENCES;
  }
}

export async function gradeAndSubmitSimulation(
  input: SimulationSubmissionInput
): Promise<SimulationAttemptResult> {
  const sim = await getSimulationDetails(input.simulationId, input.userId);
  if (!sim) {
    throw new NotFoundError(`Simulation with ID ${input.simulationId} not found.`);
  }

  const preferences = await preferencesForGrading(input.userId);
  const negativeEnabled = preferences.negativeMarkingEnabled;

  const userAnswersMap = new Map(
    input.answers.map((a) => [
      a.questionId,
      { response: a.response.trim(), timeSpentSec: a.timeSpentSec || 0 },
    ])
  );

  // Written answers each cost a model call, so the whole paper is marked
  // concurrently rather than one question after another.
  const marked = await Promise.all(
    sim.questions.map(async (q) => {
      const provided = userAnswersMap.get(q.id);
      const response = provided?.response ?? "";
      const result = await markQuestion(q, response, negativeEnabled);
      return { question: q, response, timeSpentSec: provided?.timeSpentSec, ...result };
    })
  );

  let totalScore = 0;
  let maxPossibleScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let answeredCount = 0;

  const sectionScoreMap = new Map<
    string,
    {
      sectionId: string;
      sectionName: string;
      score: number;
      maxScore: number;
      correct: number;
      incorrect: number;
      unanswered: number;
    }
  >();

  for (const sec of sim.sections) {
    sectionScoreMap.set(sec.id, {
      sectionId: sec.id,
      sectionName: sec.name,
      score: 0,
      maxScore: 0,
      correct: 0,
      incorrect: 0,
      unanswered: 0,
    });
  }

  const subjectMap = new Map<
    string,
    { score: number; maxScore: number; correct: number; total: number }
  >();
  const strongTopicSet = new Set<string>();
  const weakTopicSet = new Set<string>();

  const questionResults = marked.map((row) => {
    const q = row.question;
    const isAnswered = row.response.length > 0;

    maxPossibleScore += q.marks;

    const secStats =
      sectionScoreMap.get(q.sectionId) ??
      {
        sectionId: q.sectionId,
        sectionName: q.subject,
        score: 0,
        maxScore: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
      };
    sectionScoreMap.set(q.sectionId, secStats);
    secStats.maxScore += q.marks;

    if (!subjectMap.has(q.subject)) {
      subjectMap.set(q.subject, { score: 0, maxScore: 0, correct: 0, total: 0 });
    }
    const subjStats = subjectMap.get(q.subject)!;
    subjStats.maxScore += q.marks;
    subjStats.total += 1;

    if (isAnswered) {
      answeredCount += 1;
      if (row.isCorrect) {
        correctCount += 1;
        secStats.correct += 1;
        subjStats.correct += 1;
        if (q.topic || q.chapter) strongTopicSet.add(q.topic || q.chapter);
      } else {
        incorrectCount += 1;
        secStats.incorrect += 1;
        if (q.topic || q.chapter) weakTopicSet.add(q.topic || q.chapter);
      }
    } else {
      secStats.unanswered += 1;
    }

    totalScore += row.score;
    secStats.score += row.score;
    subjStats.score += row.score;

    return {
      questionId: q.id,
      sectionId: q.sectionId,
      subject: q.subject,
      chapter: q.chapter,
      content: q.content,
      type: q.type,
      userResponse: row.response,
      correctAnswer: q.correctAnswer,
      isCorrect: row.isCorrect,
      score: row.score,
      maxScore: q.marks,
      solution: q.solution,
      explanation: row.feedback ?? q.solution,
      timeSpentSec: row.timeSpentSec,
    };
  });

  const percentage =
    maxPossibleScore > 0 ? Math.max(0, Math.round((totalScore / maxPossibleScore) * 100)) : 0;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  // Percentile estimate
  let percentile = 50;
  if (percentage >= 85) percentile = 99.4;
  else if (percentage >= 70) percentile = 97.8;
  else if (percentage >= 55) percentile = 92.5;
  else if (percentage >= 40) percentile = 81.0;
  else if (percentage >= 25) percentile = 65.0;
  else percentile = Math.max(10, Math.round(percentage * 1.5));

  const sectionScores = Array.from(sectionScoreMap.values()).map((sec) => ({
    ...sec,
    accuracy:
      sec.correct + sec.incorrect > 0
        ? Math.round((sec.correct / (sec.correct + sec.incorrect)) * 100)
        : 0,
  }));

  const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, stat]) => ({
    subject,
    score: stat.score,
    maxScore: stat.maxScore,
    accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
  }));

  const result: SimulationAttemptResult = {
    attemptId: `sim-att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    simulationId: sim.id,
    examType: sim.examType,
    title: sim.title,
    totalScore,
    maxScore: maxPossibleScore,
    percentage,
    percentile,
    accuracy,
    timeSpentSec: input.timeSpentSec,
    totalQuestions: sim.questions.length,
    answeredCount,
    correctCount,
    incorrectCount,
    unansweredCount: sim.questions.length - answeredCount,
    proctoringViolations: input.proctoringViolations || [],
    sectionScores,
    subjectBreakdown,
    questionResults,
  };

  // Dispatch performance email report automatically
  sendExamScorecardEmail(
    {
      recipient: {
        email: input.userEmail,
        name: input.userName,
      },
      examTitle: sim.title,
      examType: sim.examType,
      score: totalScore,
      maxScore: maxPossibleScore,
      percentage,
      percentile,
      accuracy,
      timeSpentMinutes: Math.max(1, Math.round(input.timeSpentSec / 60)),
      proctoringViolationsCount: input.proctoringViolations?.length || 0,
      sectionBreakdown: sectionScores.map((s) => ({
        name: s.sectionName,
        score: s.score,
        maxScore: s.maxScore,
        accuracy: s.accuracy,
      })),
      strongTopics: Array.from(strongTopicSet).slice(0, 3),
      weakTopics: Array.from(weakTopicSet).slice(0, 3),
      reviewUrl: `${APP_URL}/simulations/${sim.id}`,
    },
    input.userId
  ).catch((err) => {
    console.warn("[SimulationService] Scorecard email dispatch deferred:", err);
  });

  return result;
}
