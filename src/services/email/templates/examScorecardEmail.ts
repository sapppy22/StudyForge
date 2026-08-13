import type { ExamScorecardPayload } from "../types";

export function renderExamScorecardEmail(data: ExamScorecardPayload): { subject: string; html: string; text: string } {
  const name = data.recipient.name || "Student";
  const passed = data.percentage >= 50;
  const isClean = data.proctoringViolationsCount === 0;

  const subject = `📊 Exam Scorecard: ${data.score}/${data.maxScore} (${data.percentage}%) on ${data.examTitle}`;

  const sectionRows = data.sectionBreakdown
    .map(
      (sec) => `
      <tr style="border-bottom: 1px solid #27272a;">
        <td style="padding: 12px 8px; color: #f4f4f5; font-weight: 500;">${sec.name}</td>
        <td style="padding: 12px 8px; text-align: center; color: #10b981; font-weight: 600;">${sec.score} / ${sec.maxScore}</td>
        <td style="padding: 12px 8px; text-align: right; color: #a1a1aa;">${sec.accuracy}%</td>
      </tr>`
    )
    .join("");

  const strongTopicsList = data.strongTopics.length
    ? data.strongTopics.map((t) => `<li style="margin-bottom: 4px; color: #10b981;">✓ ${t}</li>`).join("")
    : `<li style="color: #a1a1aa;">Keep practicing to build your strength profile!</li>`;

  const weakTopicsList = data.weakTopics.length
    ? data.weakTopics.map((t) => `<li style="margin-bottom: 4px; color: #f59e0b;">⚡ ${t}</li>`).join("")
    : `<li style="color: #10b981;">Great performance across all tested areas!</li>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
    
    <!-- Brand Header -->
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #000; font-weight: bold; border-radius: 8px; padding: 6px 14px; font-size: 16px; margin-bottom: 8px;">
        ⚡ StudyForge Exam Engine
      </div>
      <h1 style="color: #ffffff; font-size: 22px; margin: 8px 0 4px; font-weight: 700;">Performance Report</h1>
      <p style="color: #a1a1aa; font-size: 14px; margin: 0;">${data.examTitle}</p>
    </div>

    <!-- Main Score Card -->
    <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
      <p style="color: #a1a1aa; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Final Score</p>
      <div style="font-size: 48px; font-weight: 800; color: ${passed ? "#10b981" : "#e4e4e7"}; line-height: 1; margin-bottom: 8px;">
        ${data.score} <span style="font-size: 24px; color: #71717a; font-weight: 500;">/ ${data.maxScore}</span>
      </div>
      <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; padding: 4px 14px; color: #34d399; font-size: 14px; font-weight: 600; margin-bottom: 16px;">
        ${data.percentage}% Overall · ${data.accuracy}% Accuracy
      </div>

      <div style="display: flex; justify-content: space-around; border-top: 1px solid #27272a; padding-top: 16px; margin-top: 8px;">
        <div>
          <div style="color: #71717a; font-size: 12px;">Time Spent</div>
          <div style="color: #f4f4f5; font-size: 15px; font-weight: 600;">${data.timeSpentMinutes} mins</div>
        </div>
        ${
          data.percentile
            ? `<div>
          <div style="color: #71717a; font-size: 12px;">Est. Percentile</div>
          <div style="color: #10b981; font-size: 15px; font-weight: 600;">${data.percentile} %ile</div>
        </div>`
            : ""
        }
        <div>
          <div style="color: #71717a; font-size: 12px;">Proctoring Status</div>
          <div style="color: ${isClean ? "#10b981" : "#f43f5e"}; font-size: 14px; font-weight: 600;">
            ${isClean ? "🛡️ 100% Clean" : `⚠️ ${data.proctoringViolationsCount} Flag(s)`}
          </div>
        </div>
      </div>
    </div>

    <!-- Sectional Breakdown -->
    <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <h3 style="color: #ffffff; font-size: 15px; margin: 0 0 12px; font-weight: 600;">Section-wise Breakdown</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="border-bottom: 1px solid #3f3f46; text-align: left;">
            <th style="padding: 8px; color: #a1a1aa; font-weight: 500;">Section</th>
            <th style="padding: 8px; color: #a1a1aa; font-weight: 500; text-align: center;">Score</th>
            <th style="padding: 8px; color: #a1a1aa; font-weight: 500; text-align: right;">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          ${sectionRows}
        </tbody>
      </table>
    </div>

    <!-- Insights: Strengths & Focus Areas -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px;">
        <h4 style="color: #10b981; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; font-weight: 600;">💪 Key Strengths</h4>
        <ul style="margin: 0; padding-left: 0; list-style: none; font-size: 13px;">
          ${strongTopicsList}
        </ul>
      </div>

      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px;">
        <h4 style="color: #f59e0b; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; font-weight: 600;">🎯 Revision Focus</h4>
        <ul style="margin: 0; padding-left: 0; list-style: none; font-size: 13px;">
          ${weakTopicsList}
        </ul>
      </div>
    </div>

    <!-- Call to Action -->
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${data.reviewUrl}" style="display: inline-block; background-color: #10b981; color: #000000; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
        Review Full Solutions & Explanations →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; color: #71717a; font-size: 12px; border-top: 1px solid #27272a; padding-top: 16px;">
      <p style="margin: 0 0 4px;">Sent with ⚡ by StudyForge Adaptive Exam Preparation.</p>
      <p style="margin: 0;">Stay focused, revise weak chapters, and keep conquering your goals!</p>
    </div>

  </div>
</body>
</html>`;

  const text = `
StudyForge Performance Report
${data.examTitle}
Candidate: ${name}

SCORE: ${data.score} / ${data.maxScore} (${data.percentage}%)
Accuracy: ${data.accuracy}%
Time Spent: ${data.timeSpentMinutes} mins
Proctoring Violations: ${data.proctoringViolationsCount}

Section Breakdown:
${data.sectionBreakdown.map((s) => `- ${s.name}: ${s.score}/${s.maxScore} (${s.accuracy}% accuracy)`).join("\n")}

Review your full answers and step-by-step solutions here:
${data.reviewUrl}
`;

  return { subject, html, text };
}
