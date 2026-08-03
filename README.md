# StudyForge

Adaptive, spaced-repetition exam-prep platform built with Next.js 16 (App Router,
Turbopack), TypeScript, Tailwind CSS v4, shadcn/ui (base-nova), Prisma + Postgres
(pgvector), Supabase auth, Recharts, `ts-fsrs`, and the Anthropic Claude API.

## Getting started

1. **Configure environment.** Copy `.env.example` to `.env.local` and fill in your
   Postgres (`DATABASE_URL`) and Supabase credentials. `ANTHROPIC_API_KEY` is
   optional — see _Offline mode_ below.
   ```bash
   cp .env.example .env.local
   ```
2. **Install dependencies.**
   ```bash
   npm install
   ```
3. **Set up the database** (needs a Postgres with the `pgvector` extension
   available — Supabase provides this). The initial migration enables pgvector,
   creates all tables, and adds a full-text index for note retrieval.
   ```bash
   npx prisma migrate deploy   # apply prisma/migrations (or `migrate dev` locally)
   npx prisma generate
   ```
4. **Run the dev server.**
   ```bash
   npm run dev
   ```

## Offline mode (no API key required)

Every AI-backed feature degrades gracefully. When `ANTHROPIC_API_KEY` is set,
StudyForge uses **Claude (`claude-opus-4-8`)** for question generation, subjective
grading, flashcard creation and the tutor chatbot. When it is **not** set, the app
falls back to deterministic, notes-aware generators so the entire product still
works end-to-end. The Settings page shows whether AI is connected.

## Features

- **Auth** with Supabase (email + Google/GitHub OAuth). Profiles are provisioned
  in Postgres via Prisma on first sign-in.
- **Goal wizard** with syllabus templates — pick an exam and get a subject →
  chapter → topic tree automatically.
- **Topic workspace** — add notes and video links; generate flashcards and
  practice tests grounded in your notes.
- **AI question generation** — objective (MCQ) and subjective questions, grounded
  in your notes via retrieval, with an offline fallback.
- **Test engine** — auto-grading for objective questions and rubric-based grading
  for written answers (Claude, or heuristic fallback), with per-question feedback.
- **FSRS flashcards** — spaced-repetition scheduling that carries card state
  forward correctly; new and manually-created cards enter the review queue.
- **Proficiency analytics** — recency-weighted proficiency per topic, weakness
  analysis, score-trend and proficiency charts, and a decay model.
- **Weakness-weighted adaptive tests** — one click builds a mock test targeting
  your lowest-proficiency topics.
- **AI tutor** — streaming chat grounded in your notes (RAG), with source chips.
- **Notifications** — due flashcards / pending tests surfaced in the header.
- **Background jobs** (Inngest) — daily digest, weekly proficiency decay, and
  ingestion/question-generation hooks.
- **Polished UX** — light/dark themes, command palette (⌘K), loading/empty/error
  states, and responsive layouts throughout.

## Architecture notes

- **Services** (`src/services/*`) hold data access and are server-only modules
  (auth actions live in `src/services/auth/auth.ts`, marked `"use server"`).
- **AI layer** (`src/services/ai/*`) wraps the official `@anthropic-ai/sdk` with a
  graceful offline fallback for every capability.
- **RAG** uses Postgres full-text search over your notes
  (`src/services/ai/retrieval.ts`) — no external embeddings provider is required.
  The `content_items.embedding` vector column and `findSimilarChunks` remain as an
  extension point if you add one.
- **Routing** — Next.js 16 renamed the `middleware` convention to `proxy`; the
  Supabase session refresh lives in `proxy.ts`.
