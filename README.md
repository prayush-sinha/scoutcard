# ScoutCard — Valorant Recruiter Platform

A full-stack platform for Valorant Premier players and teams to find each other.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM (v5) |
| Auth | Discord OAuth 2.0 + JWT |
| Real-time | Socket.io |
| Testing | Jest + Supertest |

## Project Structure

```
src/
├── app.ts              # Express app factory
├── server.ts           # Entry point (DB connect → listen)
├── config/
│   └── env.ts          # Validated environment variables
├── lib/
│   └── prisma.ts       # Prisma client singleton
├── middleware/
│   ├── errorHandler.ts # Centralized error handling
│   ├── notFound.ts     # 404 catch-all
│   └── rateLimiter.ts  # Global + auth + verify limiters
├── routes/
│   └── index.ts        # Central router (sub-routes added per phase)
├── types/
│   └── index.ts        # Shared TS types (JWT payload, API shapes, enums)
└── utils/
    ├── availability.ts  # 168-hour week grid helpers
    ├── pagination.ts    # Page/limit parser
    └── response.ts      # Standard API response builders

prisma/
├── schema.prisma        # Prisma schema (all models + enums + indexes)
└── migrations/
    └── 001_init/
        └── migration.sql  # Raw SQL migration (GIN indexes + triggers)
```

## Getting Started

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally or via Docker

### 2. Setup

```bash
# Clone and install
npm install

# Copy environment file
cp .env.example .env
# → Edit .env with your DATABASE_URL, JWT_SECRET, Discord credentials
```

### 3. Database Setup

```bash
# Run Prisma migration (creates all tables)
npm run db:migrate

# OR use the raw SQL directly:
psql $DATABASE_URL -f prisma/migrations/001_init/migration.sql
```

### 4. Run Development Server

```bash
npm run dev
# → Server on http://localhost:3001
# → API at http://localhost:3001/api/v1
# → Health: http://localhost:3001/api/v1/health
```

### 5. Build for Production

```bash
npm run build
npm start
```

## Environment Variables

See [.env.example](.env.example) for all required variables.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for signing JWTs |
| `DISCORD_CLIENT_ID` | Phase 1.2 | Discord app client ID |
| `DISCORD_CLIENT_SECRET` | Phase 1.2 | Discord app secret |
| `TRACKER_API_KEY` | Phase 1.3 | Tracker.gg API key |

## Database Schema

```
players ──── applications ──── teams
   │               │
   └── notifications  └── application_status_history
```

### Key Design Decisions
- **GIN indexes** on `main_agents`, `playstyle_tags`, `available_hours` arrays for fast containment queries
- **168-integer array** for weekly availability (0 = Mon 00:00 → 167 = Sun 23:00)
- **UNIQUE(player_id, team_id)** constraint prevents duplicate applications
- **ApplicationStatusHistory** audit table tracks every Kanban column move

## Build Status — Phase Progress

| Phase | Status |
|---|---|
| **1.1 Project Setup & DB Schema** | ✅ Complete |
| 1.2 Discord OAuth | 🔲 Pending |
| 1.3 Verification PIN | 🔲 Pending |
| 2.1 Scout Card Form | 🔲 Pending |
| 2.2 Team Dashboard | 🔲 Pending |
| 2.3 Player Search | 🔲 Pending |
| 3.1 Application System | 🔲 Pending |
| 3.2 Kanban Board | 🔲 Pending |
| 3.3 Socket.io Real-time | 🔲 Pending |
| 4.x Polish & Deploy | 🔲 Pending |
