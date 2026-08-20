import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/shared/page-header";
import { QuestionBank } from "@/components/bank/question-bank";
import { bankSources, BANK_EXAMS } from "@/data/question-bank";
import { listGoalSummaries } from "@/services/goals/goalService";
import { examLabel } from "@/data/exams/catalog";
import type { ExamType } from "@prisma/client";

export const metadata: Metadata = { title: "Question bank" };

export default async function QuestionBankPage() {
  const user = await requireUser();
  const goals = await listGoalSummaries(user.id);

  // The sheet should open on what the student is actually preparing for.
  // Their most recent goal's exam is the best guess available; if the bank has
  // nothing for it, the first exam that does have a sheet stands in.
  const exams = BANK_EXAMS as ExamType[];
  const goalExam = goals.find((goal) => exams.includes(goal.examType))?.examType;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question bank"
        description="A curated sheet per exam — objective questions to answer in place, and derivations and numericals to work on paper. Time yourself, then tick it off."
      />
      <QuestionBank
        exams={exams.map((examType) => ({
          value: examType,
          label: examLabel(examType),
        }))}
        defaultExam={goalExam ?? exams[0]}
        sources={bankSources.map(({ label, url }) => ({ label, url }))}
      />
    </div>
  );
}
