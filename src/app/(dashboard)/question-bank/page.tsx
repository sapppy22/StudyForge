import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/shared/page-header";
import { QuestionBank } from "@/components/bank/question-bank";
import { bankSources } from "@/data/question-bank";

export const metadata: Metadata = { title: "Question bank" };

export default async function QuestionBankPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question bank"
        description="A curated sheet of subjective problems per exam. Solve on paper, time yourself, tick it off."
      />
      <QuestionBank
        sources={bankSources.map(({ label, url }) => ({ label, url }))}
      />
    </div>
  );
}
