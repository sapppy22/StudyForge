-- Full-length mock papers assembled to an exam's published pattern.
-- Stored server-side so the answer key never travels with the paper.
CREATE TABLE "mock_papers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exam_type" "ExamType" NOT NULL,
    "title" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "total_marks" INTEGER NOT NULL,
    "question_count" INTEGER NOT NULL,
    "sectional_timing" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB NOT NULL,
    "generated_by" TEXT NOT NULL DEFAULT 'ai',
    "curated_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mock_papers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mock_papers_user_id_idx" ON "mock_papers"("user_id");
CREATE INDEX "mock_papers_user_id_exam_type_idx" ON "mock_papers"("user_id", "exam_type");

ALTER TABLE "mock_papers" ADD CONSTRAINT "mock_papers_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
