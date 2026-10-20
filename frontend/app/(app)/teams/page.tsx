"use client";

import * as React from "react";
import { Users, Search, RotateCcw, Clock, ShieldCheck, Send, Info } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvailabilityStrip } from "@/components/availability-strip";
import { TeamProfileModal } from "@/components/team-profile-modal";
import { ApplyTeamModal } from "@/components/apply-team-modal";
import { teamApi } from "@/lib/api";
import {
  PREMIER_DIVISIONS,
  DIVISION_LABEL,
  VALORANT_ROLES,
  VALORANT_ROLE_LABEL,
  AGENT_ICON,
} from "@/lib/constants";
import type { PremierDivision, Team, ValorantRole } from "@/lib/types";

export default function TeamsDirectoryPage() {
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [division, setDivision] = React.useState<PremierDivision | undefined>();
  const [role, setRole] = React.useState<ValorantRole | undefined>();

  const [activeProfileTeam, setActiveProfileTeam] = React.useState<Team | null>(null);
  const [activeApplyTeam, setActiveApplyTeam] = React.useState<Team | null>(null);

  const fetchTeams = React.useCallback(() => {
    setLoading(true);
    teamApi
      .search({ division, role })
      .then(setTeams)
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  }, [division, role]);

  React.useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const hasFilters = !!division || !!role;
  const resetFilters = () => {
    setDivision(undefined);
    setRole(undefined);
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-wide text-foreground sm:text-3xl">
            Find Teams
          </h1>
          <p className="text-xs text-foreground-muted">
            Valorant Premier teams actively recruiting. Inspect rosters, compare practice schedules, and apply.
          </p>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs text-foreground-muted self-start">
            <RotateCcw size={12} /> Clear Filters
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-sm border border-border bg-card p-4">
        {/* Division Filter */}
        <div className="w-48">
          <Select
            value={division}
            onValueChange={(v) => setDivision((v || undefined) as PremierDivision | undefined)}
            placeholder="All Divisions"
            options={PREMIER_DIVISIONS.map((d) => ({ value: d, label: DIVISION_LABEL[d] }))}
          />
        </div>

        {/* Roles Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setRole(undefined)}
            className={`rounded-sm border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              !role
                ? "border-primary bg-primary/20 text-primary"
                : "border-border bg-muted/50 text-foreground-muted hover:border-foreground-muted/40 hover:text-foreground"
            }`}
          >
            All Roles
          </button>
          {VALORANT_ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(role === r ? undefined : r)}
              className={`rounded-sm border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                role === r
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-muted/50 text-foreground-muted hover:border-foreground-muted/40 hover:text-foreground"
              }`}
            >
              {VALORANT_ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Teams Grid / Loading / Empty */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="clip-notch bg-border p-px">
              <div className="clip-notch h-64 animate-pulse bg-card p-5" />
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-card/40 p-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Users size={24} className="text-foreground-muted" />
          </div>
          <h3 className="font-display text-xl font-bold uppercase tracking-wider text-foreground">
            No Teams Found
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-foreground-muted">
            {hasFilters
              ? "No recruiting teams matched your division or role filters. Try selecting 'All Roles' or clearing the division filter."
              : "No teams are currently recruiting on ScoutCard. Teams will appear here as captains create them."}
          </p>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-5">
              <RotateCcw size={13} /> Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const roster = team.roster ?? [];
            const captain = team.captain;
            const totalMembers = roster.length + (captain ? 1 : 0);

            return (
              <article key={team.id} className="clip-notch bg-border p-px">
                <div className="clip-notch flex h-full flex-col bg-card p-5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                        {team.division ? DIVISION_LABEL[team.division] : "Open Division"}
                      </p>
                      <h2 className="truncate font-display text-2xl font-black uppercase tracking-wide text-foreground">
                        {team.name}
                      </h2>
                    </div>

                    <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                      Recruiting
                    </span>
                  </div>

                  {/* Open Roles Needed */}
                  <div className="py-3">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                      Looking for
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {team.recruitingRoles && team.recruitingRoles.length > 0 ? (
                        team.recruitingRoles.map((r) => (
                          <span
                            key={r}
                            className="rounded-sm border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
                          >
                            {VALORANT_ROLE_LABEL[r]}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-foreground-muted">Open Recruitment</span>
                      )}
                    </div>
                  </div>

                  {/* Roster & Captain Snippet */}
                  <div className="flex items-center justify-between border-t border-border/60 py-2.5 text-xs text-foreground-muted">
                    <div className="flex items-center gap-1.5 truncate">
                      {captain?.discordAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={captain.discordAvatar}
                          alt=""
                          width={20}
                          height={20}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                          {captain?.riotId?.[0] ?? "C"}
                        </div>
                      )}
                      <span className="truncate text-foreground font-medium">
                        {captain?.riotId ?? captain?.discordUsername ?? "Captain"}
                      </span>
                    </div>

                    <span className="font-semibold text-foreground">
                      {totalMembers}/5 Roster
                    </span>
                  </div>

                  {/* Practice Availability Strip */}
                  <div className="pb-3 pt-1">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-foreground-muted">
                      <span>Practice schedule</span>
                      <span>{team.requiredHours?.length ?? 0} hrs/wk</span>
                    </div>
                    <AvailabilityStrip hours={team.requiredHours ?? []} />
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setActiveProfileTeam(team)}
                    >
                      Inspect Roster
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setActiveApplyTeam(team)}
                    >
                      <Send size={12} /> Apply
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Team Roster Profile Modal */}
      <TeamProfileModal
        open={!!activeProfileTeam}
        onOpenChange={(open) => !open && setActiveProfileTeam(null)}
        team={activeProfileTeam}
        onApplyClick={(team) => setActiveApplyTeam(team)}
      />

      {/* Apply with Scout Card Modal */}
      <ApplyTeamModal
        open={!!activeApplyTeam}
        onOpenChange={(open) => !open && setActiveApplyTeam(null)}
        team={activeApplyTeam}
      />
    </div>
  );
}
