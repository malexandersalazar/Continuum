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
main.py                    # FastAPI app factory; mounts /api/v1 router
apis/v1/
  routes/                  # HTTP endpoint definitions
  schemas/
    requests/              # Pydantic request models
    responses/             # Pydantic response models
  mappers/                 # DTO ↔ domain converters
application/
  use_cases/               # Business logic / workflows
  dtos/                    # Data Transfer Objects
infrastructure/
  common/logger_service.py # JSON rotating-file logger (1 MB, 10 backups)
  ai/                      # AI integration placeholders
```

OpenAPI/Swagger docs are disabled (`docs_url=None`, `redoc_url=None`, `openapi_url=None`).

Production entry point: `gunicorn` with 4 `uvicorn` workers.

### Frontend — Next.js App Router

Uses the **App Router** (not Pages Router). Key conventions live in `app/`.

> **This is Next.js 16** — APIs and conventions may differ from earlier versions. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/` and heed any deprecation notices.

Tailwind CSS 4 is configured via PostCSS. Output mode is `standalone` (optimized for the Docker multi-stage build).

### Service Communication

The frontend calls the backend at its `/api/v1` base path. In Docker Compose the frontend container depends on the backend container. For local development you will need to configure the backend URL via an environment variable in the frontend.
