import { notFound } from "next/navigation";
import { getSessionUser } from "@/services/auth/auth";
import { getTopicById } from "@/services/goals/goalService";
import { getContentItemsByTopic } from "@/services/content/contentService";
import { getFlashcardsByTopic, seedFlashcardsForTopic } from "@/services/flashcards/flashcardService";
import { getQuestionsByTopic } from "@/services/questions/questionService";
import { TopicPageClient } from "@/components/topics/topic-page";

export default async function TopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const user = await getSessionUser();
  if (!user) return null;

  const topic = await getTopicById(topicId, user.id);
  if (!topic) notFound();

  await seedFlashcardsForTopic(topicId, user.id);
  const [content, flashcards, questions] = await Promise.all([
    getContentItemsByTopic(topicId, user.id),
    getFlashcardsByTopic(topicId, user.id),
    getQuestionsByTopic(topicId, user.id),
  ]);

  return (
    <TopicPageClient
      topic={topic}
      initialContent={content}
      initialFlashcards={flashcards}
      initialQuestions={questions}
    />
  );
}
