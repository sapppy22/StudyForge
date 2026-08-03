import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  BrainCircuit,
  BookOpen,
  Layers,
  GraduationCap,
  BarChart3,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Goals & syllabus trees",
    body: "Pick an exam and get a structured syllabus tree instantly, from subjects down to individual topics.",
  },
  {
    icon: Sparkles,
    title: "Notes → practice questions",
    body: "Turn your own notes into grounded MCQs and written questions with Claude, or use the built-in offline generator.",
  },
  {
    icon: Layers,
    title: "FSRS flashcards",
    body: "Spaced-repetition scheduling that actually carries state forward, so reviews land exactly when you need them.",
  },
  {
    icon: GraduationCap,
    title: "Adaptive tests",
    body: "Weakness-weighted mock tests target your lowest-proficiency topics, with auto and rubric-based grading.",
  },
  {
    icon: BarChart3,
    title: "Proficiency analytics",
    body: "Recency-weighted proficiency per topic, weakness analysis and a decay model that keeps you honest.",
  },
  {
    icon: MessageSquare,
    title: "AI tutor with RAG",
    body: "Ask doubts and get answers grounded in your own notes, streamed in real time and cited back to the source.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BrainCircuit className="size-5" />
          </span>
          <span className="text-lg tracking-tight">StudyForge</span>
        </div>
        <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
          Sign in
        </Link>
      </header>

      <main className="flex-1">
        <section className="mx-auto w-full max-w-4xl px-6 pb-16 pt-16 text-center sm:pt-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Adaptive, spaced-repetition exam prep
          </span>
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Turn your notes into a personalized study engine
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
            StudyForge builds your syllabus, generates questions and flashcards
            from your notes, schedules reviews with FSRS, and focuses every mock
            test on your weakest topics.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-base")}
            >
              Get started free
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 px-6 text-base"
              )}
            >
              Go to dashboard
            </Link>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-xl bg-card p-6 ring-1 ring-foreground/10 transition-shadow hover:shadow-md"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-medium">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>StudyForge — adaptive exam preparation.</span>
          <span>Built with Next.js, Prisma, Supabase & Claude.</span>
        </div>
      </footer>
    </div>
  );
}
