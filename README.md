# RunLog

Distributed job scheduling platform: cron-driven HTTP callbacks, Bull queue execution, real-time execution feed (Socket.io), and workspace-based multi-tenancy.

**Live app:** [https://runlog-eta.vercel.app](https://runlog-eta.vercel.app)

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite 8, Zustand, Socket.io client |
| Backend | Node 20.19+, Express, MongoDB, Redis, Bull |
| Hosting | Vercel (UI) · Render (API) · Atlas (Mongo) · Upstash (Redis) |

## Prerequisites

- **Node.js** `>=20.19.0` (required by Vite 8)
- **MongoDB** — local install or [Atlas](https://www.mongodb.com/atlas)
- **Redis** — local install or [Upstash](https://upstash.com) (required for the job queue)

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

Local MongoDB: `mongodb://127.0.0.1:27017/runlog`  
Local Redis: `redis://127.0.0.1:6379`

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` to the backend — leave `VITE_API_URL` unset locally.

### 3. Health check

```bash
curl http://localhost:5005/api/health
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
| `REDIS_URL` | Upstash **Redis** URL only (`rediss://default:pass@….upstash.io:6379`) — not `redis-cli` command or REST URL |
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

## Environment variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | Mongo connection string |
| `JWT_SECRET` | Yes | Access token signing secret |
| `REDIS_URL` | Yes | Upstash **Redis** URL (`rediss://...`) for Bull — not the REST API URL |
| `REFRESH_TOKEN_SECRET` | No* | Refresh tokens (*falls back to `JWT_SECRET`) |
| `CLIENT_URL` | Yes (prod) | Frontend origin for CORS |
| `PORT` | No | Default `5005` (Render sets `PORT` automatically) |
| `SMTP_*` | No | Email alerts on job failure |

### Client (build-time)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full API URL in production, e.g. `https://your-api.onrender.com/api` |

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
- [ ] MongoDB and Redis are reachable from Render
- [ ] `npm run build` succeeds in `client/` on Node 20.19+
- [ ] `curl /api/health` returns `ok` after deploy
- [ ] Demo seed only in non-production environments

## Project layout

```
RUNLOG/
├── client/          React SPA (Vercel)
├── server/          Node API + scheduler + worker (Render)
├── render.yaml      Optional Render blueprint
└── .github/workflows/ci.yml
```

## License

MIT (adjust as needed for your portfolio).
