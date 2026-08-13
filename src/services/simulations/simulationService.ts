import { ExamType, QuestionType } from "@prisma/client";
import { getSimulationById, getAllSimulations, getSimulationsForExam } from "@/data/simulations";
import type {
  SimulationMock,
  SimulationAttemptResult,
  ProctoringViolation,
} from "@/data/simulations/types";
import { sendExamScorecardEmail } from "@/services/email/emailService";
import { APP_URL } from "@/lib/env";

export interface SimulationSubmissionInput {
  simulationId: string;
  userId: string;
  userEmail: string;
  userName?: string | null;
  answers: { questionId: string; response: string; timeSpentSec?: number }[];
  timeSpentSec: number;
  proctoringViolations: ProctoringViolation[];
}

export async function listAvailableSimulations(examType?: ExamType): Promise<SimulationMock[]> {
  if (examType) {
    return getSimulationsForExam(examType);
  }
  return getAllSimulations();
}

export async function getSimulationDetails(idOrSlug: string): Promise<SimulationMock | null> {
  return getSimulationById(idOrSlug) || null;
}

export async function gradeAndSubmitSimulation(
  input: SimulationSubmissionInput
): Promise<SimulationAttemptResult> {
  const sim = getSimulationById(input.simulationId);
  if (!sim) {
    throw new Error(`Simulation with ID ${input.simulationId} not found.`);
  }

  let totalScore = 0;
  let maxPossibleScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let answeredCount = 0;

  const userAnswersMap = new Map(
    input.answers.map((a) => [a.questionId, { response: a.response.trim(), timeSpentSec: a.timeSpentSec || 0 }])
  );

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

  const subjectMap = new Map<string, { score: number; maxScore: number; correct: number; total: number }>();
  const strongTopicSet = new Set<string>();
  const weakTopicSet = new Set<string>();

  const questionResults = sim.questions.map((q) => {
    const provided = userAnswersMap.get(q.id);
    const response = provided?.response ?? "";
    const isAnswered = response.length > 0;
    const marks = q.marks || 4;
    const negativeMarks = q.negativeMarks || 1;

    maxPossibleScore += marks;

    let isCorrect = false;
    let score = 0;

    const secStats = sectionScoreMap.get(q.sectionId) || {
      sectionId: q.sectionId,
      sectionName: q.subject,
      score: 0,
      maxScore: 0,
      correct: 0,
      incorrect: 0,
      unanswered: 0,
    };
    secStats.maxScore += marks;

    if (!subjectMap.has(q.subject)) {
      subjectMap.set(q.subject, { score: 0, maxScore: 0, correct: 0, total: 0 });
    }
    const subjStats = subjectMap.get(q.subject)!;
    subjStats.maxScore += marks;
    subjStats.total += 1;

    if (isAnswered) {
      answeredCount += 1;
      const expected = (q.correctAnswer || "").trim().toLowerCase();
      const actual = response.toLowerCase();

      if (q.type === QuestionType.numeric) {
        // Numerical tolerance check (allow close float match)
        const expectedNum = parseFloat(expected);
        const actualNum = parseFloat(actual);
        if (!isNaN(expectedNum) && !isNaN(actualNum) && Math.abs(expectedNum - actualNum) < 0.05) {
          isCorrect = true;
        } else {
          isCorrect = expected === actual;
        }
      } else {
        isCorrect = expected === actual;
      }

      if (isCorrect) {
        score = marks;
        correctCount += 1;
        secStats.correct += 1;
        subjStats.correct += 1;
        if (q.topic || q.chapter) strongTopicSet.add(q.topic || q.chapter);
      } else {
        score = -negativeMarks;
        incorrectCount += 1;
        secStats.incorrect += 1;
        if (q.topic || q.chapter) weakTopicSet.add(q.topic || q.chapter);
      }
    } else {
      score = 0;
      secStats.unanswered += 1;
    }

    totalScore += score;
    secStats.score += score;
    subjStats.score += score;

    return {
      questionId: q.id,
      sectionId: q.sectionId,
      subject: q.subject,
      chapter: q.chapter,
      content: q.content,
      type: q.type,
      userResponse: response,
      correctAnswer: q.correctAnswer,
      isCorrect,
      score,
      maxScore: marks,
      solution: q.solution,
      explanation: q.solution,
      timeSpentSec: provided?.timeSpentSec,
    };
  });

  const percentage = maxPossibleScore > 0 ? Math.max(0, Math.round((totalScore / maxPossibleScore) * 100)) : 0;
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
    accuracy: sec.correct + sec.incorrect > 0 ? Math.round((sec.correct / (sec.correct + sec.incorrect)) * 100) : 0,
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
