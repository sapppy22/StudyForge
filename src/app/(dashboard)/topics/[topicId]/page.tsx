import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getTopicById } from "@/services/goals/goalService";
import { getContentItemsByTopic } from "@/services/content/contentService";
import { getFlashcardsByTopic } from "@/services/flashcards/flashcardService";
import { getQuestionsByTopic } from "@/services/questions/questionService";
import { TopicPageClient } from "@/components/topics/topic-page";

export default async function TopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const user = await requireUser();

  const topic = await getTopicById(topicId, user.id);
  if (!topic) notFound();

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
