-- Per-student exam preferences, chiefly how long a mock or quiz should run.
CREATE TYPE "TestDurationMode" AS ENUM ('official', 'custom', 'per_question');

CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "test_duration_mode" "TestDurationMode" NOT NULL DEFAULT 'official',
    "custom_test_minutes" INTEGER NOT NULL DEFAULT 60,
    "seconds_per_question" INTEGER NOT NULL DEFAULT 90,
    "exam_durations" JSONB,
    "quiz_timer_enabled" BOOLEAN NOT NULL DEFAULT true,
    "quiz_seconds_per_question" INTEGER NOT NULL DEFAULT 90,
    "auto_submit_on_time_up" BOOLEAN NOT NULL DEFAULT true,
    "show_timer" BOOLEAN NOT NULL DEFAULT true,
    "warn_at_minutes" INTEGER NOT NULL DEFAULT 5,
    "enforce_sectional_timing" BOOLEAN NOT NULL DEFAULT true,
    "proctoring_enabled" BOOLEAN NOT NULL DEFAULT true,
    "negative_marking_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
