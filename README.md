# RunLog

Distributed job scheduling platform: cron-driven HTTP callbacks, Bull queue execution, real-time execution feed (Socket.io), and workspace-based multi-tenancy.

**Live app:** [https://runlog-eta.vercel.app](https://runlog-eta.vercel.app)

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite 8, Zustand, Socket.io client |
| Backend | Node 20.19+, Express, MongoDB, Redis, Bull |
| Infra | Docker Compose (Mongo, Redis, API, static client) |

## Prerequisites

- **Node.js** `>=20.19.0` (required by Vite 8)
- **MongoDB** and **Redis** (local or managed)
- For Docker: Docker Engine + Compose v2

## Local development

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit MONGODB_URI, JWT_SECRET, REDIS_URL, REFRESH_TOKEN_SECRET, CLIENT_URL=http://localhost:5173
npm install
npm run seed    # optional: demo@runlog.dev / demo123
npm run dev
```

API listens on **http://localhost:5005**.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` and does not require `VITE_API_URL` for local dev.

### 3. Health check

```bash
curl http://localhost:5005/api/health
```

## Docker Compose (recommended for demos / VPS)

### 1. Configure secrets

```bash
cp .env.example .env
# Set JWT_SECRET and REFRESH_TOKEN_SECRET to long random strings
```

### 2. Build and run

```bash
docker compose up --build -d
```

| Service | URL |
|---------|-----|
| App (UI + proxied API) | http://localhost:8080 |
| API direct (debug) | http://localhost:5005 |

### 3. Seed demo data (first time)

```bash
docker compose exec server node scripts/seed.js
```

Login: `demo@runlog.dev` / `demo123`

### 4. Logs & teardown

```bash
docker compose logs -f server
docker compose down          # keep volumes
docker compose down -v       # wipe Mongo/Redis data
```

## Production (Vercel + Render)

| Piece | Host |
|-------|------|
| Frontend | [https://runlog-eta.vercel.app](https://runlog-eta.vercel.app) (Vercel, root `client/`) |
| API | Render (root `server/`) |
| MongoDB | [Atlas](https://www.mongodb.com/atlas) |
| Redis | [Upstash](https://upstash.com) — required for Bull job queue |

### Render — service settings

| Setting | Value |
|---------|--------|
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Node | `NODE_VERSION=20.19.0` |

### Render — environment variables

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `20.19.0` |
| `MONGODB_URI` | Atlas connection string (`.../runlog?...`) |
| `REDIS_URL` | Upstash **Redis** URL (`rediss://...` — not the REST URL) |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `REFRESH_TOKEN_SECRET` | `openssl rand -hex 32` |
| `CLIENT_URL` | `https://runlog-eta.vercel.app` |

Do not set `PORT` manually on Render.

### Vercel — after Render is live

Set `VITE_API_URL=https://YOUR-SERVICE.onrender.com/api` and **redeploy** the frontend.

### Verify

```bash
curl https://YOUR-SERVICE.onrender.com/api/health
```

Seed (Render shell): `node scripts/seed.js` → `demo@runlog.dev` / `demo123`

### Docker (optional, one VPS)

Use `docker compose up --build -d` — see [Docker Compose](#docker-compose-recommended-for-demos--vps) above.

## Environment variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | Mongo connection string |
| `JWT_SECRET` | Yes | Access token signing secret |
| `REDIS_URL` | Yes | Upstash **Redis** URL (`rediss://...`) for Bull — not the REST API URL |
| `REFRESH_TOKEN_SECRET` | No* | Refresh tokens (*falls back to `JWT_SECRET`) |
| `CLIENT_URL` | Yes (prod) | Frontend origin for CORS |
| `PORT` | No | Default `5005` |
| `SMTP_*` | No | Email alerts on job failure |

### Client (build-time)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base path. Use `/api` when nginx proxies to the server; use full URL when API is on another domain |

## Ops scripts

```bash
cd server
node scripts/seed.js           # demo user + sample jobs
node scripts/checkJobs.js      # print next run times
node scripts/updateDemoJobs.js # force missing nextRunAt for active jobs
```

## Pre-deploy checklist

- [ ] `JWT_SECRET` and `REFRESH_TOKEN_SECRET` are strong and not committed
- [ ] `CLIENT_URL` matches production frontend URL
- [ ] MongoDB and Redis are backed up / managed
- [ ] `npm run build` succeeds in `client/` on Node 20.19+
- [ ] `curl /api/health` returns `ok` after deploy
- [ ] Demo seed only in non-production environments
- [ ] TLS terminated at reverse proxy for public traffic

## Project layout

```
RUNLOG/
├── client/          React SPA
├── server/          Express API + scheduler + worker
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

## License

MIT (adjust as needed for your portfolio).
