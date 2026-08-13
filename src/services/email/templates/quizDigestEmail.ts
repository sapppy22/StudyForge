import type { QuizDigestPayload } from "../types";

export function renderQuizDigestEmail(data: QuizDigestPayload): { subject: string; html: string; text: string } {
  const name = data.recipient.name || "Student";
  const subject = `🔥 ${data.period} StudyForge Digest: ${data.questionsSolved} questions solved · ${data.streakDays} day streak!`;

  const topList = data.topPerformingTopics.length
    ? data.topPerformingTopics.map((t) => `<li style="margin-bottom: 4px; color: #10b981;">✓ ${t}</li>`).join("")
    : `<li style="color: #a1a1aa;">Keep completing quizzes to build strength history.</li>`;

  const reviewList = data.topicsNeedingReview.length
    ? data.topicsNeedingReview.map((t) => `<li style="margin-bottom: 4px; color: #f59e0b;">⚡ ${t}</li>`).join("")
    : `<li style="color: #10b981;">All tested areas look strong right now!</li>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
    
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #000; font-weight: bold; border-radius: 8px; padding: 6px 14px; font-size: 16px; margin-bottom: 8px;">
        ⚡ StudyForge
      </div>
      <h1 style="color: #ffffff; font-size: 22px; margin: 8px 0 4px; font-weight: 700;">${data.period} Performance Digest</h1>
      <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Goal: ${data.goalTitle}</p>
    </div>

    <!-- Quick Stats Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 18px; text-align: center;">
        <div style="color: #71717a; font-size: 12px; text-transform: uppercase;">Quizzes & Tests</div>
        <div style="font-size: 32px; font-weight: 800; color: #10b981; margin: 4px 0;">${data.quizzesTaken}</div>
        <div style="color: #a1a1aa; font-size: 13px;">${data.questionsSolved} questions</div>
      </div>

      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 18px; text-align: center;">
        <div style="color: #71717a; font-size: 12px; text-transform: uppercase;">Avg Accuracy</div>
        <div style="font-size: 32px; font-weight: 800; color: #10b981; margin: 4px 0;">${data.averageAccuracy}%</div>
        <div style="color: #a1a1aa; font-size: 13px;">🔥 ${data.streakDays} day streak</div>
      </div>
    </div>

    <!-- Recommendations -->
    <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #ffffff; font-size: 15px; margin: 0 0 12px; font-weight: 600;">Adaptive Insights for You, ${name}</h3>
      <div style="margin-bottom: 12px;">
        <p style="color: #10b981; font-size: 13px; font-weight: 600; margin: 0 0 6px;">Top Mastery Areas:</p>
        <ul style="margin: 0; padding-left: 0; list-style: none; font-size: 13px;">${topList}</ul>
      </div>
      <div>
        <p style="color: #f59e0b; font-size: 13px; font-weight: 600; margin: 0 0 6px;">Priority Revisions Scheduled in Your Plan:</p>
        <ul style="margin: 0; padding-left: 0; list-style: none; font-size: 13px;">${reviewList}</ul>
      </div>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${data.dashboardUrl}" style="display: inline-block; background-color: #10b981; color: #000000; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 28px; border-radius: 8px;">
        Continue Practicing on Dashboard →
      </a>
    </div>

    <div style="text-align: center; color: #71717a; font-size: 12px; border-top: 1px solid #27272a; padding-top: 16px;">
      <p style="margin: 0;">Sent by StudyForge Adaptive Exam Preparation.</p>
    </div>

  </div>
</body>
</html>`;

  const text = `
StudyForge Periodic Digest
Goal: ${data.goalTitle}
Candidate: ${name}

- Quizzes taken: ${data.quizzesTaken}
- Questions solved: ${data.questionsSolved}
- Average accuracy: ${data.averageAccuracy}%
- Active streak: ${data.streakDays} days

Open your dashboard: ${data.dashboardUrl}
`;

  return { subject, html, text };
}
