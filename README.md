# Audex

AI-powered website quality analysis across 11 dimensions: security, performance, accessibility, SEO, speed, privacy, network, best practices, UI, UX, memory.

## Tech Stack

- **Runtime:** Node 24 + pnpm 10
- **Frontend:** Next.js 16, React 19, Tailwind v4, shadcn/ui
- **Backend:** Next.js API routes, MongoDB (Mongoose), Redis (Upstash + ioredis)
- **Auth:** Auth.js v5 (NextAuth) + RBAC + API keys
- **Queue:** BullMQ
- **Browser:** Playwright + Chromium
- **AI:** Anthropic Claude API
- **Monorepo:** pnpm workspaces + Turborepo
- **Hosting:** Vercel (web) + Railway (workers)

## Prerequisites

- Node 24+ (`nvm use 24`)
- pnpm 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- Docker + Docker Compose

## Quick Start

```bash
# 1. Clone and install
git clone <repo>
cd audex
pnpm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Start local services (MongoDB + Redis)
pnpm dev:services

# 4. Run migrations
pnpm db:migrate:up

# 5. Start dev server
pnpm dev
```

Web app runs at http://localhost:3000. Mongo Express at http://localhost:8081 (admin/admin).

`git clone` to running app: target < 30 minutes.

## Scripts

### Development

| Command                   | What                                  |
| ------------------------- | ------------------------------------- |
| `pnpm dev`                | Start all dev servers (web + workers) |
| `pnpm dev:web`            | Start web only                        |
| `pnpm dev:workers`        | Start workers only                    |
| `pnpm dev:services`       | Start MongoDB + Redis (Docker)        |
| `pnpm dev:services:stop`  | Stop services                         |
| `pnpm dev:services:reset` | Stop + delete volumes (fresh state)   |
| `pnpm dev:services:logs`  | Tail service logs                     |

### Build & Test

| Command                 | What                   |
| ----------------------- | ---------------------- |
| `pnpm build`            | Build all packages     |
| `pnpm lint`             | Lint all packages      |
| `pnpm typecheck`        | Typecheck all packages |
| `pnpm test:unit`        | Run unit tests         |
| `pnpm test:integration` | Run integration tests  |
| `pnpm format`           | Format with Prettier   |
| `pnpm format:check`     | Check formatting       |

### Database

| Command                  | What                     |
| ------------------------ | ------------------------ |
| `pnpm db:migrate:up`     | Apply pending migrations |
| `pnpm db:migrate:down`   | Rollback last migration  |
| `pnpm db:migrate:status` | Show migration status    |
| `pnpm db:seed`           | Seed development data    |

## Project Structure

```
audex/
├── apps/
│   └── web/                 Next.js 16 app
├── packages/
│   ├── analysis/            11 analysis engines (TBD)
│   ├── auth/                Auth.js + RBAC + API keys
│   ├── db/                  Mongoose models (9 collections)
│   ├── env/                 Zod-validated env
│   ├── infra/               Redis, BullMQ, rate limit, logger, audit log
│   ├── realtime/            SSE stream manager
│   ├── types/               Shared TypeScript types
│   ├── ui/                  shadcn/ui components
│   ├── validators/          Zod request schemas
│   └── workers/             BullMQ workers (TBD)
└── docs/
    ├── adr/                 Architecture Decision Records
    └── design/              UX/UI design docs
```

## Architecture

See `docs/adr/` for the **why** behind every major decision (10 ADRs covering auth, db, hosting, email, storage, payments, monitoring, queue, browser, AI).

## Local Services

`docker-compose.yml` runs:

| Service       | Port  | Purpose                               |
| ------------- | ----- | ------------------------------------- |
| mongodb       | 27017 | Primary database                      |
| redis         | 6379  | Cache, queue, pub/sub, rate limiting  |
| mongo-express | 8081  | DB admin UI (basic auth: admin/admin) |

All services have health checks. `pnpm dev:services` waits for services to be healthy before returning.

## Troubleshooting

**Port already in use:** Run `pnpm dev:services:stop` to release ports.

**Stale Redis state breaking tests:** Run `pnpm dev:services:reset` to nuke volumes.

**MongoDB connection refused:** Wait 10-20 seconds — first start initializes the database. Use `pnpm dev:services:logs` to verify.

**Lint errors after pulling:** Run `pnpm install` (lockfile may have changed).

**Mongo Express shows nothing:** The `audex` database is created on first write. Run `pnpm db:seed` or trigger any DB write.

## Contributing

- Conventional commits required (commitlint enforced)
- Allowed scopes: `auth, api, workers, report, billing, ui, db, types, env, validators, realtime, analysis, ci, deps, release, web, docs, infra`
- Pre-commit hooks run `format:check` + `lint`
- Pre-push hook runs `typecheck`

## License

PROPRIETARY
