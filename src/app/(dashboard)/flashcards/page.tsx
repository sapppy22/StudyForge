"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

const ratings = [
  { label: "Again", value: "again", color: "bg-red-500 hover:bg-red-600" },
  { label: "Hard", value: "hard", color: "bg-orange-500 hover:bg-orange-600" },
  { label: "Good", value: "good", color: "bg-blue-500 hover:bg-blue-600" },
  { label: "Easy", value: "easy", color: "bg-green-500 hover:bg-green-600" },
];

export default function FlashcardsPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/flashcards/due")
      .then((r) => r.json())
      .then((data) => {
        setQueue(data.cards);
        setLoading(false);
      });
  }, []);

  async function rate(rating: string) {
    const card = queue[index];
    await fetch("/api/flashcards/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flashcardId: card.flashcardId, rating }),
    });
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (index >= queue.length) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-semibold">All caught up!</h1>
        <p className="mt-2 text-muted-foreground">No more flashcards due today.</p>
      </div>
    );
  }

  const card = queue[index];
  const progress = ((index + 1) / queue.length) * 100;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {index + 1} of {queue.length} due today
        </span>
        <span>{card.topic.title}</span>
      </div>
      <Progress value={progress} className="h-2" />

      <Card
        className="min-h-[320px] cursor-pointer border-none shadow-sm"
        onClick={() => setFlipped(!flipped)}
      >
        <CardContent className="flex h-full flex-col items-center justify-center p-8 text-center">
          {flipped ? (
            <>
              <p className="text-xl font-medium">{card.flashcard.back}</p>
              <p className="mt-4 text-sm text-muted-foreground">Click card to flip back</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-semibold">{card.flashcard.front}</p>
              <p className="mt-6 text-sm text-muted-foreground">Click to reveal answer</p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-2">
        {ratings.map((r) => (
          <Button
            key={r.value}
            className={`${r.color} text-white`}
            onClick={() => rate(r.value)}
          >
            {r.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
