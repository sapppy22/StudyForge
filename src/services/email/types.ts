export interface EmailRecipient {
  email: string;
  name?: string | null;
}

export interface ExamScorecardPayload {
  recipient: EmailRecipient;
  examTitle: string;
  examType: string;
  score: number;
  maxScore: number;
  percentage: number;
  percentile?: number;
  accuracy: number;
  timeSpentMinutes: number;
  proctoringViolationsCount: number;
  sectionBreakdown: {
    name: string;
    score: number;
    maxScore: number;
    accuracy: number;
  }[];
  strongTopics: string[];
  weakTopics: string[];
  reviewUrl: string;
}

export interface QuizDigestPayload {
  recipient: EmailRecipient;
  goalTitle: string;
  period: "Weekly" | "Monthly" | "Recent";
  quizzesTaken: number;
  questionsSolved: number;
  averageAccuracy: number;
  streakDays: number;
  topPerformingTopics: string[];
  topicsNeedingReview: string[];
  dashboardUrl: string;
}

export interface SyllabusMilestonePayload {
  recipient: EmailRecipient;
  goalTitle: string;
  examType: string;
  milestonePercentage: number;
  topicsMastered: number;
  totalTopics: number;
  subjectProgress: {
    subject: string;
    percentage: number;
  }[];
  nextRecommendedChapter: string;
  actionUrl: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  previewHtml?: string;
  error?: string;
  channel: "resend" | "smtp" | "database_notification" | "development_log";
}
