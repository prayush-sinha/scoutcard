# ScoutCard Frontend

Next.js 15 (App Router) + Tailwind v4 client for the ScoutCard Valorant Premier
recruiting platform, styled per the Esports Dark Mode brief in
`gemini-code-*.md`. The API contract was originally built from
`frontend_architecture_and_integration_guide.md`, then verified line-by-line
against the real backend at
[github.com/prayush-sinha/scoutcard](https://github.com/prayush-sinha/scoutcard)
(Prisma schema, controllers, services). Where the guide and the actual code
disagreed, the code won — see "Corrected against the real backend" below.

## Setup

```bash
npm install
cp .env.local.example .env.local   # point at your running backend (port 3001)
npm run dev
```

## What's here

- `lib/types.ts`, `lib/constants.ts` — the real domain model: `PremierDivision`,
  `PlaystyleTag` (IGL/Entry/Lurk/Support/Anchor — a Scout Card's own tags),
  `ValorantRole` (Duelist/Initiator/Controller/Sentinel/Flex — a *team's*
  recruiting-role gaps, a different field entirely), `ApplicationStatus`
  (Applied → Reviewed → Trialing → Accepted/Rejected), and
  `KANBAN_TRANSITIONS`, the exact status graph the backend enforces.
- `lib/api.ts` — Axios client wired to the real endpoints (`/auth`,
  `/verification`, `/players`, `/teams`, `/applications`), Bearer-token
  interceptor, `withCredentials: true` for the cookie fallback.
- `app/auth/success/page.tsx`, `app/auth/error/page.tsx` — the Discord OAuth
  callback lands here (`?token=...&new_user=0|1` / `?message=...`), not
  inside the authenticated app shell. This is the only place the JWT gets
  written to `localStorage`.
- `hooks/useApplicationSocket.ts` — Socket.io hook implemented against the
  real event payloads (`application:created`, `application:status_changed`,
  `notification:new`) and the `team:subscribe` / `team:unsubscribe` room
  protocol, both confirmed against `src/socket/index.ts`.
- `lib/schedule.ts` + `components/schedule-grid.tsx` — the 168-hour
  `dayIndex*24 + hourOfDay` availability grid (0 = Monday 00:00 UTC,
  confirmed against the backend's own comment). Two modes:
  - `mode="hour"` — the full 7×24 grid for the Scout Card editor and Team
    Settings' `requiredHours`.
  - `mode="block"` — a coarse 7×4 Morning/Afternoon/Evening/Night scratchpad
    in the LFG board's Filter Sidebar. It computes a *client-side* overlap
    count against whatever blocks a recruiter picks. This is separate from
    the server's real `scheduleOverlap` (an actual hour count against your
    saved `Team.requiredHours`), which is attached automatically whenever a
    captain's `teamId` is sent — the two never overwrite each other (see
    `app/(app)/players/page.tsx`).
- `components/kanban-board.tsx` — `@dnd-kit` board with client-side
  transition validation against `KANBAN_TRANSITIONS` (an illegal drag, e.g.
  Applied → Accepted, reverts instantly instead of waiting on a 400), plus
  live updates via the socket hook and a rollback on a failed
  `PATCH /applications/:id/status`.
- `components/ui/*` — dependency-free primitives (Button, Badge, Dialog,
  Select, ToggleGroup, Progress, Switch) built to the shadcn/ui API shape.
  The shadcn CLI registry wasn't reachable in this environment — swap these
  for `npx shadcn add button badge dialog select toggle-group progress`
  whenever you want Radix underneath; call sites won't need to change.

## Corrected against the real backend

Cloning the actual repo turned up several places where my first pass (from
the integration guide alone) was wrong:

- **Auth field name**: `GET /auth/me` returns `id`, not `userId` — fixed
  throughout.
- **Team update endpoint**: it's `PUT /teams/:id`, keyed by the team's own
  id — *not* a `/teams/my-team` write endpoint. Team Settings now fetches
  `GET /teams/my-team` for the id, then writes to `PUT /teams/{id}`.
- **`Team.practiceHours` doesn't exist** — the real field is
  `requiredHours`. Renamed everywhere, plus added `isActivelyRecruiting`,
  which I'd missed entirely.
- **Team recruiting roles are a distinct taxonomy from Scout Card
  playstyle tags.** `Team.recruitingRoles` uses `ValorantRole`
  (Duelist/Initiator/Controller/Sentinel/Flex) — the classic shooter roles
  the original mockup suggested, just attached to the wrong field in my
  first pass. `Player.playstyleTags` (IGL/Entry/Lurk/Support/Anchor) is
  what the LFG board's Filter Sidebar actually filters/sorts by via
  `?tags=`. Both are now correctly separated in `lib/types.ts` and
  `lib/constants.ts`.
- **Scout Card autosave uses a dedicated endpoint**: `POST
  /players/scout-card/draft`, not repeated `PUT /players/scout-card` calls.
  The editor now marks itself dirty on edits and flushes via the draft
  endpoint on a 30s interval (matching the route's own "silent 30-second
  autosave" comment); `PUT /scout-card` is reserved for the explicit
  Publish action, which is the only place publish validation applies.
- **Completion score weighting**: matched to `calculateCompletionScore()`
  exactly (riotId 15, verified 10, division 15, two main agents 20, flex
  agent 10, playstyle tags 10, VOD 10, availability 10 = 100), instead of
  five equal 20% sections.
- **Riot ID verification response shape**: `POST /verification/verify-riot`
  returns `{verified, tier, badge, trustScore, breakdown, trackerData}` —
  richer than the `{isVerified, trustScore}` shape I'd assumed. The
  onboarding page now shows the actual rank/matches/hours from
  `trackerData`.
- **Kanban transitions are constrained**, not free-form: Applied → Reviewed
  | Trialing | Rejected; Reviewed → Trialing | Accepted | Rejected |
  Applied; Trialing → Accepted | Rejected | Reviewed; Accepted is terminal;
  Rejected → Applied only. `KANBAN_TRANSITIONS` + `canTransition()` enforce
  this client-side.
- **A captain's applicant list doesn't include `flexAgent`** (the
  `applicantSelectFields` projection omits it) — `ApplicantSummary` no
  longer claims it exists; the Kanban board's profile-modal card
  construction sends `null` for that field instead of a stale type error.
- **`ScoutCard.playerId` → `id`** to match `publicCardSelect`'s actual key
  — renamed across `scout-card.tsx`, the LFG board, and the Kanban board.
- **My Applications now shows the real team name** (`application.team.name`,
  confirmed present on `GET /applications/my-applications`) instead of a
  truncated team-id string.
- Confirmed correct as originally built: Socket.io event names/payloads and
  room protocol, `PATCH /applications/:id/status` body (`{status, reason}`),
  `/players/search` filter params, and the `{success, data}` /
  `{success, data, meta}` response envelopes.

## Auth gating

`middleware.ts` redirects a signed-out visitor to `/` before `/scout-card/*`,
`/my-applications`, `/team/*`, or `/onboarding` render — the pages that are
meaningless without a session. **Browsing stays public on purpose**:
`/players` (LFG board), `/players/[id]`, and `/teams/[id]` are left ungated
to match the landing page's own "Browse the LFG board" CTA for signed-out
visitors — locking those down would break that CTA and doesn't match how a
public scouting profile is meant to work.

The gate only checks whether a `token` cookie is *present*, not whether it's
valid — the backend already accepts a `token` cookie as a fallback to the
Bearer header (see `verifyToken` in `src/middleware/auth.ts`), so
`app/auth/success/page.tsx` now writes the JWT to both `localStorage` (for
the Authorization header every API call sends) and this cookie (for
`middleware.ts` to see at the edge), via the shared `setAuthToken()` /
`clearAuthToken()` helpers in `lib/api.ts`. A 401 from any API call — token
expired or invalid — clears both and bounces to `/` through a response
interceptor, so a stale cookie can't leave someone stuck on a page that will
just keep failing. The sidebar's new "Sign out" button calls
`POST /auth/logout` then clears the same state.

One real limitation: the backend's Discord OAuth callback doesn't thread a
return path through the round trip (no `state` param handling in
`initiateDiscordAuth`), so this is login-gating, not "redirect back to what
you were doing" — a signed-out visitor bounced from a protected page always
lands on the default post-login destination (`/onboarding` for a new user,
`/players` otherwise), not back where they started.

## Not yet wired

- **Notifications REST API isn't live server-side yet** — `/notifications`
  routes aren't mounted in `src/routes/index.ts` (Socket.io real-time is
  still "in progress" per the project's own architecture notes). Only the
  `notification:new` socket event works today; `lib/api.ts`'s
  `notificationApi` is kept as a forward-compatible stub that nothing calls
  yet, so the frontend needs no changes once that route ships.
- **Vouches** — no backend endpoint yet; `ProfileModal` renders them from a
  prop and shows an empty state until one exists.

## Verified working

```bash
npx tsc --noEmit   # clean
npm run build      # clean — 12 routes + middleware.ts, including /auth/success and /auth/error
```
