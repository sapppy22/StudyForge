-- Cards created from a question the student got wrong.
ALTER TYPE "FlashcardSource" ADD VALUE IF NOT EXISTS 'from_missed_question';

-- A card made from a mock paper has no syllabus topic to hang off, so the
-- link becomes optional rather than forcing a fake topic.
ALTER TABLE "flashcards" ALTER COLUMN "topic_id" DROP NOT NULL;
