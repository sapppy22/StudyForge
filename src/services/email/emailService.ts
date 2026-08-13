import { prisma } from "@/db/prisma";
import { NotificationType } from "@prisma/client";
import { APP_URL } from "@/lib/env";
import type {
  EmailSendResult,
  ExamScorecardPayload,
  QuizDigestPayload,
  SyllabusMilestonePayload,
} from "./types";
import { renderExamScorecardEmail } from "./templates/examScorecardEmail";
import { renderQuizDigestEmail } from "./templates/quizDigestEmail";
import { renderSyllabusMilestoneEmail } from "./templates/syllabusMilestoneEmail";

/**
 * Universal email dispatcher:
 * 1. If RESEND_API_KEY is configured, sends via Resend REST API.
 * 2. In all cases, records an in-app Notification record in Postgres so user can see it in-app.
 * 3. Returns EmailSendResult.
 */
async function deliverEmail({
  to,
  name: _name,
  subject,
  html,
  text,
  userId,
  notificationType,
}: {
  to: string;
  name?: string | null;
  subject: string;
  html: string;
  text: string;
  userId?: string;
  notificationType: NotificationType;
}): Promise<EmailSendResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "StudyForge <reports@studyforge.app>";

  // 1. Try sending via Resend if key is available
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Record in-app notification
        if (userId) {
          await prisma.notification.create({
            data: {
              userId,
              type: notificationType,
              title: subject,
              body: text.slice(0, 300) + "...",
            },
          }).catch(() => {});
        }
        return { success: true, messageId: data.id, channel: "resend", previewHtml: html };
      }
    } catch (err) {
      console.warn("[EmailService] Resend delivery failed, falling back to in-app log:", err);
    }
  }

  // 2. In-app notification & Dev preview fallback
  if (userId) {
    await prisma.notification.create({
      data: {
        userId,
        type: notificationType,
        title: subject,
        body: text.slice(0, 300) + "...",
      },
    }).catch(() => {});
  }

  console.log(`[EmailService] Dispatched email to ${to} (${subject}) via simulated delivery channel.`);

  return {
    success: true,
    channel: "database_notification",
    previewHtml: html,
  };
}

export async function sendExamScorecardEmail(data: ExamScorecardPayload, userId?: string): Promise<EmailSendResult> {
  const { subject, html, text } = renderExamScorecardEmail(data);
  return deliverEmail({
    to: data.recipient.email,
    name: data.recipient.name,
    subject,
    html,
    text,
    userId,
    notificationType: NotificationType.weekly_report,
  });
}

export async function sendQuizDigestEmail(data: QuizDigestPayload, userId?: string): Promise<EmailSendResult> {
  const { subject, html, text } = renderQuizDigestEmail(data);
  return deliverEmail({
    to: data.recipient.email,
    name: data.recipient.name,
    subject,
    html,
    text,
    userId,
    notificationType: NotificationType.weekly_report,
  });
}

export async function sendSyllabusMilestoneEmail(data: SyllabusMilestonePayload, userId?: string): Promise<EmailSendResult> {
  const { subject, html, text } = renderSyllabusMilestoneEmail(data);
  return deliverEmail({
    to: data.recipient.email,
    name: data.recipient.name,
    subject,
    html,
    text,
    userId,
    notificationType: NotificationType.weekly_report,
  });
}

/**
 * Automatically calculates and dispatches a performance scorecard email
 * for a completed test attempt.
 */
export async function sendPerformanceReportForAttempt(
  attemptId: string,
  userId: string,
  proctoringViolationsCount = 0
): Promise<EmailSendResult | null> {
  const attempt = await prisma.testAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      test: {
        include: {
          goal: true,
          questions: {
            include: {
              question: {
                include: { topic: true },
              },
            },
          },
        },
      },
      answers: {
        include: {
          question: {
            include: { topic: true },
          },
        },
      },
      user: true,
    },
  });

  if (!attempt || !attempt.user?.email) return null;

  const totalScore = attempt.score ?? 0;
  const maxScore = attempt.maxScore > 0 ? attempt.maxScore : 100;
  const percentage = Math.round((totalScore / maxScore) * 100);

  const answeredCount = attempt.answers.filter((a) => a.response.trim().length > 0).length;
  const correctCount = attempt.answers.filter((a) => a.isCorrect === true).length;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  // Approximate time spent in minutes
  const startedAt = new Date(attempt.startedAt).getTime();
  const submittedAt = attempt.submittedAt ? new Date(attempt.submittedAt).getTime() : Date.now();
  const timeSpentMinutes = Math.max(1, Math.round((submittedAt - startedAt) / 60000));

  // Subject / Section analysis
  const sectionMap = new Map<string, { name: string; score: number; maxScore: number; correct: number; total: number }>();
  const strongTopicSet = new Set<string>();
  const weakTopicSet = new Set<string>();

  for (const ans of attempt.answers) {
    const topic = ans.question.topic;
    const subjectName = topic?.title?.split(" - ")[0] || "General";

    if (!sectionMap.has(subjectName)) {
      sectionMap.set(subjectName, { name: subjectName, score: 0, maxScore: 0, correct: 0, total: 0 });
    }
    const sec = sectionMap.get(subjectName)!;
    sec.score += ans.score ?? 0;
    sec.maxScore += ans.maxScore > 0 ? ans.maxScore : 10;
    sec.total += 1;
    if (ans.isCorrect) {
      sec.correct += 1;
      if (topic?.title) strongTopicSet.add(topic.title);
    } else {
      if (topic?.title) weakTopicSet.add(topic.title);
    }
  }

  const sectionBreakdown = Array.from(sectionMap.values()).map((s) => ({
    name: s.name,
    score: s.score,
    maxScore: s.maxScore,
    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
  }));

  // Estimate percentile for competitive exams
  let percentile = 50;
  if (percentage >= 90) percentile = 99.5;
  else if (percentage >= 80) percentile = 98.2;
  else if (percentage >= 70) percentile = 95.0;
  else if (percentage >= 60) percentile = 90.0;
  else if (percentage >= 50) percentile = 82.0;
  else if (percentage >= 40) percentile = 70.0;
  else percentile = Math.max(10, Math.round(percentage * 1.2));

  const payload: ExamScorecardPayload = {
    recipient: {
      email: attempt.user.email,
      name: attempt.user.name,
    },
    examTitle: attempt.test.title,
    examType: attempt.test.goal?.examType || "EXAM",
    score: totalScore,
    maxScore,
    percentage,
    percentile,
    accuracy,
    timeSpentMinutes,
    proctoringViolationsCount,
    sectionBreakdown: sectionBreakdown.length > 0 ? sectionBreakdown : [{ name: "General Test", score: totalScore, maxScore, accuracy }],
    strongTopics: Array.from(strongTopicSet).slice(0, 3),
    weakTopics: Array.from(weakTopicSet).slice(0, 3),
    reviewUrl: `${APP_URL}/tests/${attempt.testId}`,
  };

  return sendExamScorecardEmail(payload, userId);
}
