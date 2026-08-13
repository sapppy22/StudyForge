-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ExamType" ADD VALUE 'SSC_CGL';
ALTER TYPE "ExamType" ADD VALUE 'SSC_CHSL';

-- CreateTable
CREATE TABLE "bank_questions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "exam_type" "ExamType" NOT NULL,
    "subject" TEXT NOT NULL,
    "chapter" TEXT NOT NULL,
    "topic" TEXT,
    "type" "QuestionType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "content" TEXT NOT NULL,
    "options" JSONB,
    "correct_answer" TEXT,
    "solution" TEXT,
    "hint" TEXT,
    "marks" INTEGER NOT NULL DEFAULT 4,
    "expected_minutes" INTEGER NOT NULL DEFAULT 3,
    "year" INTEGER,
    "source_name" TEXT,
    "source_url" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "bookmarked" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "time_spent_sec" INTEGER NOT NULL DEFAULT 0,
    "best_time_sec" INTEGER,
    "notes" TEXT,
    "solved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bank_questions_slug_key" ON "bank_questions"("slug");

-- CreateIndex
CREATE INDEX "bank_questions_exam_type_subject_idx" ON "bank_questions"("exam_type", "subject");

-- CreateIndex
CREATE INDEX "bank_questions_exam_type_difficulty_idx" ON "bank_questions"("exam_type", "difficulty");

-- CreateIndex
CREATE INDEX "bank_questions_exam_type_chapter_idx" ON "bank_questions"("exam_type", "chapter");

-- CreateIndex
CREATE INDEX "bank_progress_user_id_idx" ON "bank_progress"("user_id");

-- CreateIndex
CREATE INDEX "bank_progress_user_id_solved_idx" ON "bank_progress"("user_id", "solved");

-- CreateIndex
CREATE INDEX "bank_progress_question_id_idx" ON "bank_progress"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_progress_user_id_question_id_key" ON "bank_progress"("user_id", "question_id");

-- AddForeignKey
ALTER TABLE "bank_progress" ADD CONSTRAINT "bank_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_progress" ADD CONSTRAINT "bank_progress_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "bank_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

