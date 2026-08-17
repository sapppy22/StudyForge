# ⚡ StudyForge

**Next-generation, adaptive competitive exam preparation platform** featuring authentic CBT simulations, anti-cheat proctoring, AI-generated memory maps, dynamic study plans, curated subjective question banks, and automated performance email reports.

---

## 🌟 Key Features

### 1. 🔐 Production Authentication, Sign-Up & Guest Mode
- Real functional email/password authentication via Supabase Auth (publishable or legacy anon keys).
- Secure email verification redirect flows and password reset recovery (`/reset-password`).
- Optional social sign-in (Google / GitHub), shown only for providers you've actually enabled.
- Automatic profile provisioning in PostgreSQL via Prisma.
- **Guest mode**: use the entire product with no account — a signed, http-only cookie plus a real
  `profiles` row, so goals, notes, tests, flashcards and analytics behave identically. Sign up later
  and the guest's work is re-keyed onto the new account, nothing lost.

### 2. 📝 Curated Question Bank (Striver Sheet Model)
- Curated subjective problem sets for **JEE Main, JEE Advanced, NEET (UG), and SSC CGL**.
- Categorized by Subject, Chapter, Topic, and Difficulty (`Easy`, `Medium`, `Hard`).
- Interactive solve tracking: tick/untick progress, per-question benchmark stopwatches, and on-demand worked solution reveals.

### 3. 🧠 AI-Generated Memory Maps
- Hierarchical interactive mind maps generated over topic notes and syllabus chapters.
- Expandable/collapsible nodes, pan, zoom, and instant SVG/JSON export.
- Offline deterministic fallback when AI keys are not configured.

### 4. 📅 Adaptive AI Study Plan
- Goal-driven study scheduler tailored to daily time budgets and target exam dates.
- **Dynamic Re-Prioritization**: Automatically rewrites future schedule blocks when test or quiz scores move topic proficiencies.

### 5. 🎯 Real Exam CBT Simulations
- Authentic Computer-Based Test (CBT) engine modeled after official **NTA (JEE Main/Advanced), NEET (UG), and SSC CGL (Tier-1)** interfaces.
- Sectional navigation with live timers, negative marking calculations (+4/-1, +2/-0.5), numerical integer keypads, and official TCS/NTA question status palettes (Answered, Marked for Review, Not Visited).
- Instant scorecards with accuracy %, section-wise breakdown, percentile estimates, and worked solutions.

### 6. 🛡️ Anti-Cheat & Exam Proctoring Engine
- Fullscreen lockdown enforcement during exams.
- Real-time tab switch (`visibilitychange`) and app switch (`window.onblur`) detection.
- Keyboard shortcut interception (DevTools, Inspect, Copy) and synthesized audio alarm.
- Violation counter (3 warnings max) with automatic test lockdown and disqualification flags.

### 7. 📊 Automated Performance Email Reports
- Multi-channel delivery via Resend API and in-app notifications.
- Rich responsive black & emerald green HTML email templates:
  - **Exam Simulation Scorecard**: Score breakdown, accuracy, time spent, percentile, proctoring audit, and revision suggestions.
  - **Periodic Quiz Digest**: Weekly streak, questions solved, and priority chapters.
  - **Syllabus Coverage Milestone**: Celebratory progress milestone alerts.

### 8. 🌙 Black & Emerald Theme
- Tailored modern dark theme (`#09090b` / `#000000` with emerald green `#10b981` accents).
- High-contrast accessibility with light/system theme support.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack, Server Actions) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Styling** | Tailwind CSS v4 + Vanilla CSS Design Tokens |
| **Database** | PostgreSQL + Prisma ORM (with `pgvector` extension) |
| **Authentication** | Supabase Auth (`@supabase/ssr`) |
| **AI Engine** | Anthropic Claude API (`@ai-sdk/anthropic` & SDK) |
| **Charts** | Recharts |
| **Spaced Repetition** | `ts-fsrs` (Free Spaced Repetition Scheduler) |
| **Email Delivery** | Resend API + In-App Notification Engine |
| **CI / CD** | GitHub Actions + Render Blueprint (`render.yaml`) + Vercel |

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/sapppy22/StudyForge.git
cd StudyForge
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your configuration:
```env
# PostgreSQL connection string (Supabase → Project Settings → Database).
# Prefer the Supavisor pooler host on serverless/IPv4-only hosts — see
# "Supabase setup" below.
DATABASE_URL="postgresql://postgres:password@localhost:5432/studyforge?schema=public"

# Supabase Auth (Project Settings → API Keys)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
# Legacy JWT key — only needed if the project hasn't rotated to a publishable key
NEXT_PUBLIC_SUPABASE_ANON_KEY=""

# Public App URL — OAuth and password-reset callbacks are built from this
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Guest mode ("false" to require an account) + HMAC key for its session cookie
NEXT_PUBLIC_ENABLE_GUEST_MODE="true"
GUEST_SESSION_SECRET=""            # openssl rand -hex 32

# Social buttons to show. Only list providers enabled in Supabase, e.g. "google,github"
NEXT_PUBLIC_OAUTH_PROVIDERS=""

# Optional: Claude AI features (offline fallback used if empty)
ANTHROPIC_API_KEY=""

# Optional: Resend API for email delivery (in-app notifications used if empty)
RESEND_API_KEY=""
EMAIL_FROM="StudyForge <reports@studyforge.app>"
```

### 3. Initialize Database
```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the app. Click **Try it as a guest** to
go straight in, or create an account with email + password.

---

## 🔑 Supabase & Auth Setup

**API keys.** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`) is the current-generation
browser key and takes precedence; `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains supported for projects
still on legacy JWT keys. Set at least one — `isSupabaseConfigured()` gates every auth action on it,
and when neither is present the app degrades to guest-only rather than throwing.

**Database URL.** `db.<ref>.supabase.co:5432` (direct) resolves to **IPv6 only**. Render and Vercel
egress over IPv4, so production must use the Supavisor pooler string instead:

```
postgresql://postgres.<project-ref>:<password>@<pooler-host>:6543/postgres?pgbouncer=true
```

Copy the exact pooler host from Project Settings → Database → *Connection pooling* (it encodes the
project's AWS region). Local development can keep the direct host if your network has IPv6.

**Dashboard settings that affect sign-in** (Supabase → Authentication):
- *URL Configuration* → **Site URL** and **Redirect URLs** must include
  `https://<your-domain>/api/auth/callback` (and `http://localhost:3000/api/auth/callback` for local
  dev). Without it, email confirmation and OAuth links bounce.
- *Providers* → **Email** is on by default; email confirmation is required unless you turn on
  auto-confirm, which is why sign-up says "confirm your email, then sign in".
- Enable **Google**/**GitHub** there *and* list them in `NEXT_PUBLIC_OAUTH_PROVIDERS` for the buttons
  to appear. Providers that aren't enabled are hidden rather than dead-ending at the redirect.

**Guest mode.** `POST` of the `continueAsGuest` action issues a `sf_guest` cookie —
`<guest_uuid>.<issuedAt>.<HMAC-SHA256>`, http-only, `SameSite=Lax`, `Secure` in production, 30-day
lifetime enforced on both ends. `proxy.ts` verifies the signature on every request, so a tampered
cookie is treated as unauthenticated. Guest ids are prefixed `guest_` and can never collide with a
Supabase UUID. On sign-in / sign-up confirmation, `claimGuestProfile()` re-keys `profiles.id` onto the
real auth id; every child table declares `ON UPDATE CASCADE`, so all of the guest's work moves in one
statement. Guest profiles carry a placeholder `@guest.studyforge.local` address, and the email
dispatcher keeps their reports in-app only.

---

## 🔄 CI/CD & Deployment Pipeline

StudyForge is configured for continuous integration and continuous deployment:

```mermaid
flowchart LR
    A[git push to main] --> B[GitHub Actions CI / CD]
    B --> C[Lint + Typecheck + Next.js Build]
    B --> D[Deploy Pipeline]
    D --> E[Render Auto-Deploy Blueprint]
    D --> F[Vercel Instant Deployment]
    E --> G[Live Production App Updated]
    F --> G
```

- **GitHub Actions (`.github/workflows/ci.yml`)**: Validates schema, runs ESLint, TypeScript checks (`tsc --noEmit`), and builds the Next.js production bundle on every push and pull request.
- **Continuous Deployment (`.github/workflows/deploy.yml`)**: Automates deployment hooks upon merging to `main`.
- **Render (`render.yaml`)**: Native Node.js web service blueprint linked to branch `main` with `/api/health` monitoring.
- **Vercel (`vercel.json`)**: Zero-config deployment with automatic client generation via `"postinstall": "prisma generate"`.

---

## 📁 Repository Structure

```
├── .github/workflows/       # CI and Deployment Actions
├── prisma/
│   ├── schema.prisma        # Database schema (PostgreSQL)
│   └── migrations/          # Version-controlled database migrations
├── public/                  # Static assets & brand media
├── src/
│   ├── app/                 # Next.js 16 App Router pages & API routes
│   │   ├── (auth)/          # Authentication & password reset
│   │   ├── (dashboard)/     # Main app screens (Simulations, Bank, Plan, Tests)
│   │   └── api/             # REST API route handlers
│   ├── components/          # Reusable UI & feature components
│   │   ├── simulations/     # CBT exam player & proctoring guard
│   │   ├── mindmap/         # AI memory maps canvas
│   │   ├── bank/            # Question sheet & timer components
│   │   └── plan/            # Adaptive study plan timeline
│   ├── data/                # Seed questions, patterns & curated mock papers
│   ├── lib/                 # Shared utilities, session helpers & validators
│   └── services/            # Backend service layer (AI, Email, Simulations, Tests)
├── render.yaml              # Render infrastructure blueprint
└── vercel.json              # Vercel deployment specification
```

---

## 🛡️ License

MIT License. Built with precision for competitive exam students.
