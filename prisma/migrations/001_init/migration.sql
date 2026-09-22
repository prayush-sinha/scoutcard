-- ============================================================================
--  ScoutCard - Initial Schema Migration
--  Generated: 2026-09-20
--  Run via: psql $DATABASE_URL -f prisma/migrations/001_init/migration.sql
--  OR: managed automatically by `npx prisma migrate dev`
-- ============================================================================

-- Enable UUID extension (required for gen_random_uuid() / @default(uuid()))
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
--  ENUM TYPES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE "PremierDivision" AS ENUM (
  'Open',
  'Intermediate',
  'Advanced',
  'Elite',
  'Contender',
  'Invite'
);

CREATE TYPE "ApplicationStatus" AS ENUM (
  'Applied',
  'Reviewed',
  'Trialing',
  'Accepted',
  'Rejected'
);

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLE: players
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "players" (
  "id"               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "discord_id"       TEXT          NOT NULL UNIQUE,
  "discord_token"    TEXT,
  "discord_username" TEXT,
  "discord_avatar"   TEXT,
  "riot_id"          TEXT,
  "verification_pin" CHAR(4),
  "is_verified"      BOOLEAN       NOT NULL DEFAULT FALSE,
  "division"         "PremierDivision",
  "main_agents"      TEXT[]        NOT NULL DEFAULT '{}',
  "flex_agent"       TEXT,
  "playstyle_tags"   TEXT[]        NOT NULL DEFAULT '{}',
  "vod_url"          TEXT,
  "available_hours"  INTEGER[]     NOT NULL DEFAULT '{}',
  "is_published"     BOOLEAN       NOT NULL DEFAULT FALSE,
  "created_at"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- GIN index for fast array containment queries on main_agents
-- e.g. WHERE main_agents @> ARRAY['Omen']
CREATE INDEX "idx_players_main_agents_gin"
  ON "players" USING GIN ("main_agents");

-- GIN index on playstyle_tags for fast overlap queries
-- e.g. WHERE playstyle_tags && ARRAY['Aggressive']
CREATE INDEX "idx_players_playstyle_tags_gin"
  ON "players" USING GIN ("playstyle_tags");

-- GIN index on available_hours for schedule compatibility queries
-- e.g. WHERE available_hours @> required_hours
CREATE INDEX "idx_players_available_hours_gin"
  ON "players" USING GIN ("available_hours");

CREATE INDEX "idx_players_is_verified"
  ON "players" ("is_verified");

CREATE INDEX "idx_players_division"
  ON "players" ("division");

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLE: teams
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "teams" (
  "id"                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "captain_id"             UUID          NOT NULL REFERENCES "players"("id") ON DELETE CASCADE,
  "name"                   TEXT          NOT NULL UNIQUE,
  "division"               "PremierDivision" NOT NULL,
  "recruiting_roles"       TEXT[]        NOT NULL DEFAULT '{}',
  "is_actively_recruiting" BOOLEAN       NOT NULL DEFAULT TRUE,
  "required_hours"         INTEGER[]     NOT NULL DEFAULT '{}',
  "created_at"             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_teams_captain_id"
  ON "teams" ("captain_id");

CREATE INDEX "idx_teams_is_recruiting"
  ON "teams" ("is_actively_recruiting");

CREATE INDEX "idx_teams_division"
  ON "teams" ("division");

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLE: applications
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "applications" (
  "id"               UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  "player_id"        UUID              NOT NULL REFERENCES "players"("id") ON DELETE CASCADE,
  "team_id"          UUID              NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "status"           "ApplicationStatus" NOT NULL DEFAULT 'Applied',
  "message"          VARCHAR(500),
  "captain_notes"    TEXT,
  "notes_updated_at" TIMESTAMPTZ,
  "created_at"       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  -- Prevent a player from applying to the same team twice
  CONSTRAINT "uq_application_player_team" UNIQUE ("player_id", "team_id")
);

CREATE INDEX "idx_applications_status"
  ON "applications" ("status");

CREATE INDEX "idx_applications_team_id"
  ON "applications" ("team_id");

CREATE INDEX "idx_applications_player_id"
  ON "applications" ("player_id");

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLE: application_status_history  (Kanban audit trail)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "application_status_history" (
  "id"              UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  "application_id"  UUID              NOT NULL REFERENCES "applications"("id") ON DELETE CASCADE,
  "from_status"     "ApplicationStatus",
  "to_status"       "ApplicationStatus" NOT NULL,
  "changed_by"      UUID,
  "note"            TEXT,
  "changed_at"      TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_status_history_application_id"
  ON "application_status_history" ("application_id");

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLE: notifications
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "notifications" (
  "id"         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "player_id"  UUID        NOT NULL REFERENCES "players"("id") ON DELETE CASCADE,
  "type"       TEXT        NOT NULL,
  "payload"    JSONB       NOT NULL DEFAULT '{}',
  "is_read"    BOOLEAN     NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_notifications_player_unread"
  ON "notifications" ("player_id", "is_read");

-- ─────────────────────────────────────────────────────────────────────────────
--  TRIGGER: auto-update updated_at on row changes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trg_players_updated_at"
  BEFORE UPDATE ON "players"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "trg_teams_updated_at"
  BEFORE UPDATE ON "teams"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "trg_applications_updated_at"
  BEFORE UPDATE ON "applications"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
