"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { topicStatusLabel } from "@/lib/topic-utils";
import {
  BookOpen,
  FileText,
  Play,
  Layers,
  GraduationCap,
  ArrowLeft,
  Loader2,
} from "lucide-react";

export function TopicPageClient({
  topic,
  initialContent,
  initialFlashcards,
  initialQuestions,
}: {
  topic: any;
  initialContent: any[];
  initialFlashcards: any[];
  initialQuestions: any[];
}) {
  const [content, setContent] = useState(initialContent);
  const [flashcards, setFlashcards] = useState(initialFlashcards);
  const [questions, setQuestions] = useState(initialQuestions);
  const [topicState, setTopicState] = useState(topic);
  const [generating, setGenerating] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  async function refetch() {
    const [topicRes, contentRes, cardsRes, questionsRes] = await Promise.all([
      fetch(`/api/topics/${topicState.id}`),
      fetch(`/api/content?topicId=${topicState.id}`),
      fetch(`/api/flashcards?topicId=${topicState.id}`),
      fetch(`/api/questions?topicId=${topicState.id}`),
    ]);
    const [t, c, f, q] = await Promise.all([
      topicRes.json(),
      contentRes.json(),
      cardsRes.json(),
      questionsRes.json(),
    ]);
    setTopicState(t);
    setContent(c);
    setFlashcards(f);
    setQuestions(q);
  }

  async function updateStatus(status: string) {
    await fetch(`/api/topics/${topicState.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refetch();
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId: topicState.id,
        type: "note",
        title: noteTitle || "Untitled note",
        rawText: noteText,
      }),
    });
    setNoteTitle("");
    setNoteText("");
    refetch();
  }

  async function addVideo(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId: topicState.id,
        type: "video",
        title: "YouTube video",
        sourceUrl: videoUrl,
      }),
    });
    setVideoUrl("");
    refetch();
  }

  async function generateTest() {
    setGenerating(true);
    const res = await fetch("/api/tests/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId: topicState.id,
        goalId: topicState.goalId,
        questionMix: { objective: 4, subjective: 1 },
        title: `${topicState.title} practice test`,
      }),
    });
    const data = await res.json();
    window.location.href = `/tests/${data.id}`;
  }

  const proficiency = topicState.proficiencyScores[0]?.score ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{topicState.title}</h1>
          <p className="text-sm text-muted-foreground">
            {topicState.goal.title} &middot; {topicStatusLabel(topicState.status)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32">
            <Progress value={proficiency} className="h-2" />
          </div>
          <span className="text-sm font-medium">{proficiency}%</span>
          <Select value={topicState.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not started</SelectItem>
              <SelectItem value="learning">Learning</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="mastered">Mastered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" /> Notes
          </CardTitle>
          <CardDescription>Your notes and curated references for this topic.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {content
            .filter((c) => c.type === "note")
            .map((item) => (
              <div key={item.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" /> {item.title}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {item.rawText}
                </p>
              </div>
            ))}
          <form onSubmit={addNote} className="space-y-3">
            <Label htmlFor="noteTitle">Add a note</Label>
            <Input
              id="noteTitle"
              placeholder="Note title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />
            <Textarea
              placeholder="Paste or type your notes here..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button type="submit" size="sm">
              Save note
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Play className="h-5 w-5" /> Videos
          </CardTitle>
          <CardDescription>Paste a YouTube link to attach a video transcript.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {content
            .filter((c) => c.type === "video")
            .map((item) => (
              <div key={item.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Play className="h-4 w-4" /> {item.title}
                </div>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-sm text-indigo-600 hover:underline"
                >
                  {item.sourceUrl}
                </a>
              </div>
            ))}
          <form onSubmit={addVideo} className="flex gap-2">
            <Input
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <Button type="submit" size="sm">
              Add video
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5" /> Flashcards
          </CardTitle>
          <CardDescription>Auto-generated and manually created cards.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {flashcards.map((card) => (
              <div key={card.id} className="rounded-lg border bg-white p-4">
                <p className="font-medium">{card.front}</p>
                <p className="mt-2 text-sm text-muted-foreground">{card.back}</p>
              </div>
            ))}
          </div>
          {flashcards.length === 0 && (
            <p className="text-sm text-muted-foreground">No flashcards yet. Generate a test to seed cards.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5" /> Practice
          </CardTitle>
          <CardDescription>Generate objective + subjective questions for this topic.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {questions.slice(0, 5).map((q) => (
              <Badge key={q.id} variant="secondary">
                {q.type}
              </Badge>
            ))}
            {questions.length === 0 && (
              <p className="text-sm text-muted-foreground">No questions generated yet.</p>
            )}
          </div>
          <Button onClick={generateTest} disabled={generating}>
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate test
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
