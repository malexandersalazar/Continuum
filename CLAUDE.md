# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Monorepo with two services:

- `backend/core-api/` — FastAPI REST API (Python 3.13)
- `frontend/platform-web/` — Next.js 16 / React 19 frontend (TypeScript)
- `docker-compose.yml` — Orchestrates both services (backend on :10000, frontend on :3000)

## Commands

### Backend (`backend/core-api/`)

Uses `uv` for dependency management (see `uv.lock`).

```bash
uv run fastapi dev main.py          # local dev server
uv add <package>                    # add a dependency
```

No test or lint commands are configured yet.

### Frontend (`frontend/platform-web/`)

Uses `pnpm`.

```bash
pnpm dev        # dev server (port 3000)
pnpm build      # production build
pnpm lint       # ESLint
```

### Docker (full stack)

First-time setup — create log mount directories:

```bash
mkdir -p backend/core-api/logs
mkdir -p frontend/platform-web/logs
```

Then:

```bash
docker compose up --build       # build and start both services
docker compose up -d            # run in background
docker compose logs -f backend  # tail a single service
docker compose down             # stop
```

A single `.env` file at the repository root is required by Docker Compose. See `.env.example` for all variables.

## Architecture

### Backend — Clean/Layered Architecture

```
main.py                           # FastAPI app factory + CORS; mounts /api/v1
apis/__init__.py                  # api_v1_router (APIRouter) + api_v1 (FastAPI sub-app with CORS)
apis/v1/
  routes/__init__.py              # Endpoint handlers (decorated on api_v1_router)
  schemas/requests/__init__.py    # Pydantic request models
  schemas/responses/__init__.py   # Pydantic response models
  mappers/__init__.py             # Request → DTO, DTO → Response converters
application/
  use_cases/__init__.py           # Business logic orchestrators
  dtos/__init__.py                # Dataclass DTOs (shared between layers)
infrastructure/
  ai/claude_exam_analyzer.py      # Claude API client (AsyncAnthropic)
  knowledge_base.py               # Demo topics (mirrors frontend KB)
  common/logger_service.py        # JSON rotating-file logger
```

Key deps: `fastapi`, `anthropic`, `uvicorn`, `gunicorn`, `python-dotenv`.

OpenAPI/Swagger docs are disabled. Production: `gunicorn` with 4 `uvicorn` workers.

### Frontend — Next.js App Router

Uses **App Router** (not Pages). **Next.js 16** — read guides in `node_modules/next/dist/docs/` before writing Next.js code.

```
app/                              # Routes (all "use client")
  planning/page.tsx               # Topic selection + exam upload
  planning/review/page.tsx        # Plan review & approval
  learning/page.tsx               # Student dashboard
  learning/session/[sessionId]/   # Chat session
features/
  planning/                       # Teacher plan creation feature
    components/                   # TopicTree, ExamUploader, PlanDraftReview, TopicPlanCard
    hooks/usePlanDraft.ts         # Plan generation state
    services/planningService.ts   # API calls + localStorage persistence
  learning/                       # Student learning feature
    components/                   # ChatWindow, MessageBubble, TopicBrowser, etc.
    hooks/                        # useSession, useFaceSignal (MediaPipe)
    services/learningService.ts   # Session management (still mock/localStorage)
    lib/                          # EAR calculator, drowsiness analyzer, face classifier
shared/
  domain/types.ts                 # All shared TypeScript interfaces
  domain/knowledgeBase.ts         # 4 demo Álgebra topics + helpers
  domain/mockPlanner.ts           # Mock plan generator (unused, kept for reference)
  domain/mockTutor.ts             # Mock tutor replies (used by learning)
  lib/apiClient.ts                # Fetch wrapper (NEXT_PUBLIC_API_BASE_URL, 120s timeout)
  lib/storage.ts                  # localStorage helpers (plan:*, session:*)
  ui/                             # Card, Button, Badge, Input, Textarea, Spinner
```

Tailwind CSS 4 via PostCSS. Output mode `standalone` (Docker).

### Service Communication

Frontend calls backend at `/api/v1` via `apiClient` (`NEXT_PUBLIC_API_BASE_URL`). CORS enabled on backend. In Docker the frontend depends on the backend container.

## Implemented Features

### Planning — Exam Analysis + Plan Generation (Flujo 1)

**Endpoint**: `POST /api/v1/plans/generate`

**Flow**: Teacher selects topics → uploads exam PDFs → backend analyzes with Claude → returns `LevelingPlan` → teacher reviews/approves.

- **Frontend**: `ExamUploader` reads PDFs as base64 via `FileReader`. `planningService.generatePlan()` POSTs to backend, saves result to localStorage for the learning feature.
- **Backend**: `GeneratePlanUseCase` orchestrates two Claude API calls via `ClaudeExamAnalyzer`:
  1. `analyze_errors()` — sends PDF documents + topic reference to Claude, gets structured error analysis (severity 1-3 per topic)
  2. `generate_plan()` — sends error analysis to Claude, gets leveling plan with Gagné event sequences
- **Model**: `claude-sonnet-4-6` (configured in `infrastructure/ai/claude_exam_analyzer.py`)
- **Knowledge base**: 4 Álgebra topics duplicated in both frontend (`shared/domain/knowledgeBase.ts`) and backend (`infrastructure/knowledge_base.py`)

### Learning — Adaptive Tutoring Sessions (Flujo 2/3)

**Status**: Frontend-only with mocks. No backend endpoints yet.

- Student picks an approved plan or explores a topic freely
- Chat interface with mock tutor replies based on Gagné events
- Face detection via MediaPipe (EAR-based drowsiness, engagement tracking)
- `mockTutor.ts` handles `detectState()`, `selectGagneEvent()`, `generateTutorReply()`

## Environment Variables

See `.env.example`. Key vars: `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_API_BASE_URL`, `ENV`, `LOG_LEVEL`.
