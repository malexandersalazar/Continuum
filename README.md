# Continuum

An AI-powered adaptive tutoring platform that helps students remediate learning gaps through personalized, pedagogically-structured sessions. Teachers upload exam results; Claude analyzes errors and generates leveling plans; students work through adaptive chat sessions while face detection monitors engagement in real time.

---

## Features

### Planning (Flujo 1)
- Teacher selects topics and uploads exam PDFs
- Backend calls Claude (Sonnet 4.6) to analyze errors by severity (1–3)
- Claude generates a `LevelingPlan` mapping each topic to a Gagné event sequence
- Teacher reviews and approves the plan before students access it

### Learning (Flujo 2/3)
- Student starts a session from an approved plan or explores a topic freely
- Chat interface driven by Claude, structured around Gagné's 9 events of instruction
- Adaptive difficulty adjusts based on student state (confusion, fatigue, engagement)
- Real-time face detection via MediaPipe (EAR-based drowsiness + engagement tracking)
- Markdown rendering in tutor responses (math via MathJax, syntax highlighting via highlight.js)

---

## Repository Layout

```
root/
├── backend/core-api/          # FastAPI REST API (Python 3.13)
│   ├── apis/v1/               # Route handlers, request/response schemas, mappers
│   ├── application/           # Use cases + DTOs
│   ├── domain/                # Domain models
│   ├── infrastructure/        # Claude API clients, knowledge base, logger
│   └── persistence/           # Storage layer (WIP)
├── frontend/platform-web/     # Next.js 16 / React 19 (TypeScript)
│   ├── app/                   # App Router pages (planning, learning, session)
│   ├── features/              # Feature modules (planning, learning)
│   └── shared/                # Types, knowledge base, API client, UI components
└── docker-compose.yml         # Orchestrates backend (:10000) + frontend (:3000)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend language | Python 3.13 |
| Backend framework | FastAPI + Uvicorn / Gunicorn |
| Backend deps | `uv` |
| AI | Anthropic SDK (`claude-sonnet-4-6`) |
| Frontend framework | Next.js 16 (App Router), React 19 |
| Frontend language | TypeScript |
| Frontend deps | `pnpm` |
| Styling | Tailwind CSS 4 |
| Face detection | MediaPipe Tasks Vision |
| Markdown | react-markdown + remark-gfm/math + rehype-mathjax + rehype-highlight |
| Containers | Docker Compose |

---

## Prerequisites

- Docker + Docker Compose (for full-stack run)
- Python 3.13 + [`uv`](https://docs.astral.sh/uv/) (for backend-only dev)
- Node.js 20+ + [`pnpm`](https://pnpm.io/) (for frontend-only dev)
- An Anthropic API key

---

## Environment Setup

Create a `.env` file at the repository root (see `.env.example`):

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Backend
ENV=development
LOG_LEVEL=INFO

# Frontend (baked into client bundle at build time)
NEXT_PUBLIC_API_BASE_URL=http://localhost:10000

# Frontend server-side (used inside Docker for internal calls)
BACKEND_URL=http://backend:10000
```

---

## Running the Project

### Full stack with Docker

```bash
# First-time: create log mount directories
mkdir -p backend/core-api/logs frontend/platform-web/logs

# Build and start both services
docker compose up --build

# Run in background
docker compose up -d

# Tail logs for a single service
docker compose logs -f backend
docker compose logs -f frontend

# Stop
docker compose down
```

Services:
- Frontend → http://localhost:3000
- Backend → http://localhost:10000
- API base → http://localhost:10000/api/v1

> OpenAPI/Swagger docs are disabled on the backend.

---

### Backend only

```bash
cd backend/core-api
uv run fastapi dev main.py      # hot-reload dev server on :10000
```

Add a dependency:

```bash
uv add <package>
```

---

### Frontend only

```bash
cd frontend/platform-web
pnpm dev        # dev server on :3000
pnpm build      # production build
pnpm lint       # ESLint
```

---

## Architecture

### Backend — Clean/Layered

```
Request → Router → Mapper (Request→DTO) → Use Case → Mapper (DTO→Response) → Response
                                              ↕
                                     Infrastructure (Claude API, KB, Logger)
```

Key files:

| File | Role |
|---|---|
| `main.py` | FastAPI app factory, CORS, mounts `/api/v1` |
| `apis/v1/routes/` | Endpoint handlers |
| `application/use_cases/` | Business logic orchestrators |
| `infrastructure/ai/claude_exam_analyzer.py` | Exam error analysis + plan generation |
| `infrastructure/ai/claude_session_tutor.py` | Adaptive tutoring response generation |
| `infrastructure/knowledge_base.py` | 4 demo Álgebra topics |

### Frontend — Next.js App Router

```
app/                          Route pages
features/planning/            Topic selection, exam upload, plan review
features/learning/            Session chat, face signal, topic browser
shared/                       Types, API client, storage helpers, UI kit
```

Key files:

| File | Role |
|---|---|
| `shared/domain/types.ts` | All shared TypeScript interfaces |
| `shared/lib/apiClient.ts` | Fetch wrapper (120 s timeout) |
| `features/learning/hooks/useFaceSignal.ts` | MediaPipe face detection hook |
| `features/learning/components/MessageBubble.tsx` | Chat bubble with markdown rendering |

### Gagné's 9 Events

The tutoring engine sequences instruction using Gagné's events:

| # | Event |
|---|---|
| E1 | Ganar atención (capture attention) |
| E2 | Informar objetivos (state objectives) |
| E3 | Estimular recuerdo previo (stimulate prior knowledge) |
| E4 | Presentar contenido (present content) |
| E5 | Guiar el aprendizaje (guide learning) |
| E6 | Provocar la práctica (elicit practice) |
| E7 | Dar retroalimentación (provide feedback) |
| E8 | Evaluar desempeño (assess performance) |
| E9 | Promover retención y transferencia (promote transfer) |

Error severity determines event coverage: severity 3 → full sequence, severity 2 → partial, severity 1 → refocus.

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/plans/generate` | Analyze exam PDFs and generate a leveling plan |
| `POST` | `/api/v1/sessions/start` | Start a tutoring session (WIP) |
| `POST` | `/api/v1/sessions/{id}/message` | Send a message in a session (WIP) |

Request/response schemas live in `backend/core-api/apis/v1/schemas/`.

---

## Status

| Feature | Status |
|---|---|
| Exam analysis + plan generation | Implemented |
| Plan review UI | Implemented |
| Chat session UI | Implemented |
| Face detection (EAR/drowsiness) | Implemented |
| Markdown + math in chat | Implemented |
| Backend tutoring endpoints | In progress |
| Persistence layer | In progress |
| Backend tests | Not configured |
