# TaskOps - HedgeOne Screening Project

TaskOps is a mini task management dashboard built for the HedgeOne Full Stack Developer Intern screening project. It implements the required task CRUD flow and adds a business-operations layer inspired by custom workflow tools: filters, status analytics, overdue detection, and an Ops Command feature that turns a short operational instruction into a task draft.

## Live Demo

Production: https://taskops-hedgeone-screening.vercel.app

## Features

- Create, view, update, and delete tasks
- Required task fields: title, description, status, due date
- Extra operational fields: priority and owner
- Status workflow: Todo, In Progress, Completed
- Supabase Postgres integration through API routes
- Search, status filtering, overdue filtering, and sorting
- Dashboard metrics for open, in-progress, completed, overdue, due-this-week, and completion rate
- Ops Pulse panel with deterministic risk scoring and workload distribution
- Ops Command parser that drafts a task from natural language
- Responsive dashboard layout for desktop and mobile
- Demo mode fallback for local review when Supabase credentials are not configured

## Tech Stack

- Next.js
- TypeScript
- React
- Supabase Postgres
- CSS modules via global design tokens
- Vitest and Testing Library setup
- GitHub Actions CI

## Database Setup

1. Create a free Supabase project.
2. Open the Supabase SQL editor.
3. Run [`database/schema.sql`](database/schema.sql).
4. Copy your Supabase project URL and service-role key into `.env.local`.

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TASKOPS_DEMO_MODE=false
```

For local review without Supabase, set:

```env
TASKOPS_DEMO_MODE=true
```

The production path is Supabase Postgres. Demo mode exists only so reviewers can run the UI instantly without paid services or account setup.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm test
npm run build
```

## AI Tools Used

AI tools were used for:

- Translating the screening brief into an implementation checklist
- Generating a visual direction for the dashboard
- Drafting code structure and test cases
- Reviewing likely edge cases around task validation, overdue logic, and local setup

All generated code was manually reviewed and verified with linting, unit tests, production build, and browser smoke testing.

## Architecture Notes

- `src/app/api/tasks` exposes task CRUD endpoints.
- `src/lib/task-store.ts` isolates persistence. It uses Supabase Postgres when credentials are present and demo memory storage when explicitly enabled or credentials are absent.
- `src/lib/task-utils.ts` contains pure task logic for summaries, risk scoring, validation, sorting, and Ops Command parsing.
- `src/components/task-dashboard.tsx` contains the interactive dashboard surface.

## Tradeoffs

- Authentication is intentionally excluded because it was not part of the screening brief.
- Demo mode uses in-memory data and is not a replacement for the Supabase Postgres path.
- Ops Command is deterministic rather than calling a paid AI API, keeping the project free-tier friendly and easy to inspect.
