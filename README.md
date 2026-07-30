# StudyForge

Adaptive exam preparation platform built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma, and Supabase.

## Getting started

1. Copy `.env.example` to `.env.local` and fill in your Supabase and Anthropic credentials.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Features

- Auth with Supabase (email + OAuth)
- Goal setup wizard with syllabus templates
- Topic-based content ingestion (notes, videos)
- AI question generation and subjective grading (stubbed)
- Test engine with auto/objective grading
- FSRS flashcard scheduling
- Proficiency analytics and weakness-weighted tests
- Chatbot with RAG grounding (stubbed)
- Background jobs with Inngest
