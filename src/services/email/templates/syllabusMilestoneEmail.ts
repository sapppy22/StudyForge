import type { SyllabusMilestonePayload } from "../types";

export function renderSyllabusMilestoneEmail(data: SyllabusMilestonePayload): { subject: string; html: string; text: string } {
  const name = data.recipient.name || "Student";
  const subject = `🎉 Milestone Unlocked: ${data.milestonePercentage}% of ${data.goalTitle} Syllabus Completed!`;

  const subjectProgressRows = data.subjectProgress
    .map(
      (sp) => `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
          <span style="color: #f4f4f5; font-weight: 500;">${sp.subject}</span>
          <span style="color: #10b981; font-weight: 600;">${sp.percentage}%</span>
        </div>
        <div style="background-color: #27272a; height: 6px; border-radius: 3px; overflow: hidden;">
          <div style="background-color: #10b981; height: 100%; width: ${sp.percentage}%;"></div>
        </div>
      </div>`
    )
    .join("");

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
      <div style="font-size: 40px; margin-bottom: 8px;">🏆</div>
      <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 4px; font-weight: 800;">Milestone Reached!</h1>
      <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Awesome work, <strong>${name}</strong>! You have mastered <strong style="color: #10b981;">${data.milestonePercentage}%</strong> of your syllabus.</p>
    </div>

    <!-- Progress Card -->
    <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      <div style="text-align: center; margin-bottom: 16px;">
        <span style="font-size: 44px; font-weight: 800; color: #10b981;">${data.topicsMastered}</span>
        <span style="font-size: 20px; color: #71717a;"> / ${data.totalTopics} topics</span>
        <p style="color: #a1a1aa; font-size: 13px; margin: 4px 0 0;">Solidified through notes, memory maps, and tests</p>
      </div>

      <div style="border-top: 1px solid #27272a; padding-top: 16px;">
        <h4 style="color: #ffffff; font-size: 14px; margin: 0 0 12px; font-weight: 600;">Subject Progress:</h4>
        ${subjectProgressRows}
      </div>
    </div>

    <!-- Next chapter advice -->
    <div style="background-color: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
      <div style="color: #34d399; font-size: 13px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">🚀 AI Recommended Next Chapter</div>
      <div style="color: #f4f4f5; font-size: 15px; font-weight: 600;">${data.nextRecommendedChapter}</div>
      <p style="color: #a1a1aa; font-size: 13px; margin: 4px 0 0;">Your study plan has updated with targeted practice and memory maps for this module.</p>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${data.actionUrl}" style="display: inline-block; background-color: #10b981; color: #000000; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 28px; border-radius: 8px;">
        Open Study Plan & Start Next Chapter →
      </a>
    </div>

    <div style="text-align: center; color: #71717a; font-size: 12px; border-top: 1px solid #27272a; padding-top: 16px;">
      <p style="margin: 0;">StudyForge · Precision Prep for Competitive Exams</p>
    </div>

  </div>
</body>
</html>`;

  const text = `
StudyForge Milestone Unlocked!
${data.milestonePercentage}% of ${data.goalTitle} completed!
Topics mastered: ${data.topicsMastered} / ${data.totalTopics}

Next suggested chapter: ${data.nextRecommendedChapter}
Open your plan: ${data.actionUrl}
`;

  return { subject, html, text };
}
