# ScoutCard — Valorant Premier Recruiter Platform

A modern full-stack platform for competitive Valorant Premier players and esports teams to discover, recruit, and manage talent with verified stats and real-time scheduling.

---

## 🚀 Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | Next.js 15 (App Router), React 18, Tailwind CSS v4 | Esports dark mode UI, responsive grid layouts |
| **Backend** | Node.js, Express, TypeScript | RESTful API + real-time Socket.io engine |
| **Database** | PostgreSQL (Neon), Prisma ORM (v5) | Relational data, GIN array indexes, audit history |
| **Real-time** | Socket.io | Instant Kanban status updates & application alerts |
| **Auth** | Discord OAuth 2.0 + JWT | Secure social authentication & cookie edge gating |
| **Verification** | Tracker.gg API + Dev Mock Fallback | Automated Riot ID verification & Trust Score calculation |
| **UI & UX** | @dnd-kit, Lucide Icons | Smooth drag-and-drop Kanban workflow |
| **Testing** | Jest, Supertest | Integration & unit test suites (50+ tests) |

---

## 📁 Project Structure

```
scoutcard/
├── src/                          # Express + TypeScript Backend
│   ├── app.ts                    # Express app factory (middleware, CORS, routes)
│   ├── server.ts                 # Server entry point (HTTP + Socket.io listener)
│   ├── config/env.ts             # Validated environment configuration
│   ├── controllers/              # Request handlers (auth, player, team, application, verification)
│   ├── services/                 # Business logic & external API fetchers
│   ├── routes/                   # API endpoint definitions (/api/v1/*)
│   ├── middleware/               # Auth, rate limiting, error handler, not-found
│   ├── socket/                   # Socket.io room management & broadcast handlers
│   ├── utils/                    # 168-hr availability calculator, validator, pagination
│   └── __tests__/                # Jest integration and unit test suites
│
├── frontend/                     # Next.js 15 App Router Frontend
│   ├── app/                      # Next.js App Router pages
│   │   ├── (app)/                # Authenticated layout & sub-pages
│   │   │   ├── players/          # LFG scout card discovery & filtering
│   │   │   ├── scout-card/edit/  # Interactive scout card creator & autosave
│   │   │   ├── team/applications/# Real-time drag-and-drop Kanban board
│   │   │   ├── team/settings/    # Team roster, roles, and required schedule
│   │   │   └── my-applications/  # Player's application status tracker
│   │   ├── auth/                 # OAuth callback & error handlers
│   │   └── page.tsx              # Landing page
│   ├── components/               # UI components, Kanban columns, ScheduleGrid
│   ├── hooks/                    # useApplicationSocket custom hook
│   ├── lib/                      # Axios API client, domain types, constants
│   └── middleware.ts             # Edge route protection & token validation
│
├── prisma/
│   ├── schema.prisma             # Database models, relations, enums & indexes
│   ├── seed.ts                   # Development test database seed
│   └── migrations/               # PostgreSQL migrations
└── .env.example                  # Environment variable template
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14+ (or a cloud [Neon](https://neon.tech) database)
- **Git**

### 2. Environment Setup

#### Backend `.env`
Create a `.env` file in the project root:
```bash
cp .env.example .env
```
Fill in the required configuration:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: A secure random string for JWT signing
- `DISCORD_CLIENT_ID` & `DISCORD_CLIENT_SECRET`: From Discord Developer Portal
- `DISCORD_REDIRECT_URI`: `http://localhost:3001/api/v1/auth/discord/callback`
- `CLIENT_URL`: `http://localhost:3000` (Next.js frontend)
- `TRACKER_API_KEY`: Tracker.gg API key (mock fallback is automatically enabled in `NODE_ENV=development` if omitted)

#### Frontend `.env.local`
Create a `.env.local` file inside the `frontend/` directory:
```bash
cd frontend
cp .env.local.example .env.local
cd ..
```
Defaults:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

### 3. Installation & Database Migration

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Run database migrations
npm run db:migrate

# (Optional) Seed initial mock players and teams
npm run db:seed
```

---

### 4. Running the Development Servers

You can run both services concurrently:

```bash
# Terminal 1 — Start the Backend (port 3001)
npm run dev

# Terminal 2 — Start the Frontend (port 3000)
cd frontend
npm run dev
```

- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001/api/v1](http://localhost:3001/api/v1)
- **API Health Check**: [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health)

---

## 🧪 Testing

The backend includes a comprehensive Jest and Supertest test suite testing integration endpoints, schedule overlap algorithms, and validation rules:

```bash
npm test
```

To run individual test suites:
```bash
npx jest src/__tests__/api.test.ts          # API integration tests
npx jest src/__tests__/availability.test.ts # 168-hour schedule grid math
npx jest src/__tests__/validation.test.ts   # Funnel & input validations
```

---

## 🔑 Core Features

- **Verified Scout Cards**: Riot ID verification with Tracker.gg stats, peak ranks, trust scores, agent preferences, Medal.tv / YouTube VOD clips, and an interactive 168-hour weekly availability matrix.
- **Smart LFG Discovery**: Search players filtered by Premier division, main/flex agents, playstyle tags (IGL, Entry, Lurk, Support, Anchor), and real-time team schedule overlap percentages.
- **Interactive Kanban Recruitment**: Team captains manage candidate pipelines across 4 stages (`Applied`, `Reviewed`, `Trialing`, `Accepted` / `Rejected`) with strict state transition enforcement, status history audits, and real-time Socket.io synchronization.
- **Team Roster & Schedule Coordination**: Define required practice hours, manage player roles, and track candidate compatibility automatically.

---

## 📊 Development Progress

| Phase | Milestone | Status |
|---|---|:---:|
| **1.1** | Project Setup & PostgreSQL Schema with GIN indexes | ✅ Complete |
| **1.2** | Discord OAuth 2.0 & JWT Authentication | ✅ Complete |
| **1.3** | Riot ID Verification & Trust Score Engine | ✅ Complete |
| **2.1** | Scout Card API, Draft Autosave & VOD Validation | ✅ Complete |
| **2.2** | Team Dashboard & Mandatory Practice Schedules | ✅ Complete |
| **2.3** | Player Search & Schedule Overlap Scoring | ✅ Complete |
| **3.1** | Team Application System & History Logging | ✅ Complete |
| **3.2** | Kanban Status Machine & Audit Trail | ✅ Complete |
| **3.3** | Real-time Socket.io Sync Engine | ✅ Complete |
| **4.1** | Next.js 15 Client & Drag-and-Drop Kanban Board | ✅ Complete |
| **4.2** | Final Verification & Production Hardening | 🔄 In Progress |

---

## 🛡️ License

This project is licensed under the MIT License.
