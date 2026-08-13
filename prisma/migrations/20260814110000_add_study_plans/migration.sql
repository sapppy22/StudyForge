-- CreateEnum
CREATE TYPE "StudyPlanStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "StudyTaskKind" AS ENUM ('learn', 'practice', 'revise', 'test');

-- CreateTable
CREATE TABLE "study_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "daily_minutes" INTEGER NOT NULL,
    "status" "StudyPlanStatus" NOT NULL DEFAULT 'active',
    "rationale" TEXT,
    "generated_by" TEXT NOT NULL DEFAULT 'ai',
    "version" INTEGER NOT NULL DEFAULT 1,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plan_tasks" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "topic_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" "StudyTaskKind" NOT NULL,
    "minutes" INTEGER NOT NULL DEFAULT 30,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plan_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_plans_user_id_idx" ON "study_plans"("user_id");

-- CreateIndex
CREATE INDEX "study_plans_goal_id_idx" ON "study_plans"("goal_id");

-- CreateIndex
CREATE INDEX "study_plans_user_id_status_idx" ON "study_plans"("user_id", "status");

-- CreateIndex
CREATE INDEX "study_plan_tasks_plan_id_idx" ON "study_plan_tasks"("plan_id");

-- CreateIndex
CREATE INDEX "study_plan_tasks_plan_id_scheduled_for_idx" ON "study_plan_tasks"("plan_id", "scheduled_for");

-- CreateIndex
CREATE INDEX "study_plan_tasks_topic_id_idx" ON "study_plan_tasks"("topic_id");

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_tasks" ADD CONSTRAINT "study_plan_tasks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_tasks" ADD CONSTRAINT "study_plan_tasks_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "syllabus_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

