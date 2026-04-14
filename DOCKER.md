# Running with Docker Compose

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running
- `.env` file present at the repository root — copy `.env.example` to `.env` and adjust values as needed

## First-time setup

Create the local log directories so Docker can mount them without permission issues:

```bash
mkdir -p backend/core-api/logs
mkdir -p frontend/platform-web/logs
```

## Start all services

```bash
docker compose up --build
```

Remove `--build` on subsequent runs if the source has not changed.

## Run in the background

```bash
docker compose up --build -d
```

## View logs

Stream all services at once:

```bash
docker compose logs -f
```

Stream a single service:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Persistent log files

Both containers mount their `/app/logs` directory to your local machine:

| Service  | Container path | Host path                        |
|----------|---------------|----------------------------------|
| backend  | `/app/logs`   | `backend/core-api/logs/`         |
| frontend | `/app/logs`   | `frontend/platform-web/logs/`    |

Any log files written by the application are immediately visible in those host directories without restarting the container.

## Stop services

```bash
docker compose down
```

Add `-v` to also remove named volumes if you created any.

## Service URLs

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:3000  |
| Backend  | http://localhost:10000 |
