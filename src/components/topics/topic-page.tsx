"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusStyles } from "@/lib/topic-utils";
import {
  FileText,
  Play,
  Layers,
  GraduationCap,
  ArrowLeft,
  Loader2,
  Plus,
  Sparkles,
  Network,
} from "lucide-react";
import { MindMapPanel } from "@/components/mindmap/mind-map-panel";
import { MathText } from "@/components/shared/math-text";

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
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [flashcards, setFlashcards] = useState(initialFlashcards);
  const [questions] = useState(initialQuestions);
  const [status, setStatus] = useState<string>(topic.status);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");

  const [savingNote, setSavingNote] = useState(false);
  const [savingVideo, setSavingVideo] = useState(false);
  const [genCards, setGenCards] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [objective, setObjective] = useState("4");
  const [subjective, setSubjective] = useState("1");
  const [difficulty, setDifficulty] = useState("adaptive");

  const proficiency = Math.round(topic.proficiencyScores?.[0]?.score ?? 0);
  const notes = content.filter((c) => c.type === "note");
  const videos = content.filter((c) => c.type === "video");

  async function refetchContent() {
    const c = await fetch(`/api/content?topicId=${topic.id}`).then((r) => r.json());
    setContent(c);
  }
  async function refetchCards() {
    const f = await fetch(`/api/flashcards?topicId=${topic.id}`).then((r) => r.json());
    setFlashcards(f);
  }

  async function updateStatus(next: string | null) {
    if (!next) return;
    setStatus(next);
    await fetch(`/api/topics/${topic.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    }).catch(() => toast.error("Failed to update status"));
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSavingNote(true);
    await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId: topic.id,
        type: "note",
        title: noteTitle || "Untitled note",
        rawText: noteText,
      }),
    });
    setNoteTitle("");
    setNoteText("");
    await refetchContent();
    setSavingNote(false);
    toast.success("Note saved");
  }

  async function addVideo(e: React.FormEvent) {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    setSavingVideo(true);
    await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId: topic.id,
        type: "video",
        title: "Video",
        sourceUrl: videoUrl,
      }),
    });
    setVideoUrl("");
    await refetchContent();
    setSavingVideo(false);
    toast.success("Video added");
  }

  async function generateFlashcards() {
    setGenCards(true);
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", topicId: topic.id, count: 6 }),
      });
      if (!res.ok) throw new Error();
      await refetchCards();
      toast.success("Flashcards generated from your notes");
    } catch {
      toast.error("Could not generate flashcards");
    } finally {
      setGenCards(false);
    }
  }

  async function addCard(e: React.FormEvent) {
    e.preventDefault();
    if (!cardFront.trim() || !cardBack.trim()) return;
    setAddingCard(true);
    await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId: topic.id, front: cardFront, back: cardBack }),
    });
    setCardFront("");
    setCardBack("");
    await refetchCards();
    setAddingCard(false);
    toast.success("Flashcard added");
  }

  async function generateTest() {
    setGenerating(true);
    try {
      const res = await fetch("/api/tests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topic.id,
          goalId: topic.goalId,
          questionMix: { objective: Number(objective), subjective: Number(subjective) },
          difficulty,
          title: `${topic.title} practice test`,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success("Test ready");
      router.push(`/tests/${data.id}`);
    } catch {
      toast.error("Could not generate test");
      setGenerating(false);
    }
  }

  const statusStyle = statusStyles[status as keyof typeof statusStyles];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{topic.title}</h1>
          <p className="text-sm text-muted-foreground">
            {[topic.parent?.title, topic.goal?.title].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Proficiency</span>
              <span className="tabular-nums">{proficiency}%</span>
            </div>
            <Progress value={proficiency} className="h-1.5" />
          </div>
          <Select value={status} onValueChange={updateStatus}>
            <SelectTrigger className="w-36" size="sm">
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

      {statusStyle && (
        <Badge className={cn("gap-1", statusStyle.className)}>
          {statusStyle.label}
        </Badge>
      )}

      <Tabs defaultValue="notes" className="w-full">
        <TabsList>
          <TabsTrigger value="notes">
            <FileText className="size-4" /> Notes
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Play className="size-4" /> Videos
          </TabsTrigger>
          <TabsTrigger value="mindmap">
            <Network className="size-4" /> Memory map
          </TabsTrigger>
          <TabsTrigger value="flashcards">
            <Layers className="size-4" /> Flashcards
          </TabsTrigger>
          <TabsTrigger value="practice">
            <GraduationCap className="size-4" /> Practice
          </TabsTrigger>
        </TabsList>

        {/* Notes */}
        <TabsContent value="notes" className="space-y-4 pt-4">
          {notes.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="size-4 text-muted-foreground" /> {item.title}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {item.rawText}
                </p>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardContent className="py-4">
              <form onSubmit={addNote} className="space-y-3">
                <Label htmlFor="noteTitle">Add a note</Label>
                <Input
                  id="noteTitle"
                  placeholder="Note title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Paste or type your notes here… these ground question and flashcard generation."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={5}
                />
                <Button type="submit" size="sm" disabled={savingNote}>
                  {savingNote && <Loader2 className="size-4 animate-spin" />}
                  Save note
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videos */}
        <TabsContent value="videos" className="space-y-4 pt-4">
          {videos.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Play className="size-4 text-muted-foreground" /> {item.title}
                </div>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all text-sm text-primary hover:underline"
                >
                  {item.sourceUrl}
                </a>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardContent className="py-4">
              <form onSubmit={addVideo} className="flex gap-2">
                <Input
                  placeholder="https://youtube.com/watch?v=…"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <Button type="submit" size="sm" disabled={savingVideo}>
                  {savingVideo ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Add
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flashcards */}
        <TabsContent value="flashcards" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {flashcards.length} card{flashcards.length === 1 ? "" : "s"}
            </p>
            <Button size="sm" variant="outline" onClick={generateFlashcards} disabled={genCards}>
              {genCards ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Generate from notes
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {flashcards.map((card) => (
              <Card key={card.id}>
                <CardContent className="py-4">
                  <p className="font-medium">
                    <MathText>{card.front}</MathText>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <MathText>{card.back}</MathText>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="py-4">
              <form onSubmit={addCard} className="space-y-3">
                <Label>Add a card manually</Label>
                <Input
                  placeholder="Front (question)"
                  value={cardFront}
                  onChange={(e) => setCardFront(e.target.value)}
                />
                <Input
                  placeholder="Back (answer)"
                  value={cardBack}
                  onChange={(e) => setCardBack(e.target.value)}
                />
                <Button type="submit" size="sm" disabled={addingCard}>
                  {addingCard && <Loader2 className="size-4 animate-spin" />}
                  Add card
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Practice */}
        <TabsContent value="practice" className="space-y-4 pt-4">
          <Card>
            <CardContent className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Generate a practice test grounded in your notes.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">MCQs</Label>
                  <Select value={objective} onValueChange={(v) => setObjective(v ?? "4")}>
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["2", "3", "4", "5", "6"].map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Written</Label>
                  <Select value={subjective} onValueChange={(v) => setSubjective(v ?? "1")}>
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["0", "1", "2", "3"].map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v ?? "adaptive")}>
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adaptive">Adaptive</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={generateTest} disabled={generating}>
                {generating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <GraduationCap className="size-4" />
                )}
                Generate test
              </Button>
            </CardContent>
          </Card>

          {questions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {questions.slice(0, 12).map((q) => (
                <Badge key={q.id} variant="secondary">
                  {q.type} · {q.difficulty}
                </Badge>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Memory map */}
        <TabsContent value="mindmap" className="space-y-4 pt-4">
          <MindMapPanel
            topicId={topic.id}
            notes={notes.map((n: { id: string; title: string }) => ({
              id: n.id,
              title: n.title,
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
