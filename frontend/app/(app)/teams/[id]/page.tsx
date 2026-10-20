"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { BadgeCheck, Clock, Send, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvailabilityStrip } from "@/components/availability-strip";
import { ApplyTeamModal } from "@/components/apply-team-modal";
import { DIVISION_LABEL, VALORANT_ROLE_LABEL, AGENT_ICON } from "@/lib/constants";
import { teamApi } from "@/lib/api";
import { trustTier, type Team } from "@/lib/types";

const TRUST_VARIANT = { high: "success", medium: "warning", low: "danger" } as const;

export default function PublicTeamProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [team, setTeam] = React.useState<Team | null>(null);
  const [applyModalOpen, setApplyModalOpen] = React.useState(false);

  React.useEffect(() => {
    teamApi.getById(id).then(setTeam).catch(() => setTeam(null));
  }, [id]);

  if (!team) {
    return (
      <div className="py-12 text-center text-sm text-foreground-muted">
        Loading team profile…
      </div>
    );
  }

  const roster = team.roster ?? [];
  const captain = team.captain;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back to Teams */}
      <button
        onClick={() => router.push("/teams")}
        className="flex items-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft size={14} /> Back to Find Teams
      </button>

      {/* Main Team Dossier Card */}
      <div className="clip-notch bg-border p-px">
        <div className="clip-notch bg-card p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-border/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {team.division ? DIVISION_LABEL[team.division] : "Open Division"}
                </span>
                {team.isActivelyRecruiting && (
                  <span className="rounded-full bg-success/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-success">
                    Actively Recruiting
                  </span>
                )}
              </div>
              <h1 className="mt-1 font-display text-4xl font-black uppercase tracking-wide text-foreground">
                {team.name}
              </h1>
            </div>

            <Button onClick={() => setApplyModalOpen(true)}>
              <Send size={14} /> Apply to Team
            </Button>
          </div>

          {/* Roles Needed */}
          <div className="py-6 border-b border-border/60">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Open Positions
            </h3>
            <div className="flex flex-wrap gap-2">
              {team.recruitingRoles && team.recruitingRoles.length > 0 ? (
                team.recruitingRoles.map((r) => (
                  <span
                    key={r}
                    className="rounded-sm border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                  >
                    {VALORANT_ROLE_LABEL[r]}
                  </span>
                ))
              ) : (
                <p className="text-xs text-foreground-muted">Open recruitment across all roles.</p>
              )}
            </div>
          </div>

          {/* Active Roster */}
          <div className="py-6 border-b border-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                Current Roster ({roster.length + (captain ? 1 : 0)} / 5 Players)
              </h3>
            </div>

            <div className="space-y-2.5">
              {/* Captain */}
              {captain && (
                <div className="flex items-center justify-between rounded-sm border border-border bg-muted/40 p-3.5">
                  <div className="flex items-center gap-3 truncate">
                    {captain.discordAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={captain.discordAvatar}
                        alt=""
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/40"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                        {captain.riotId?.[0] ?? "C"}
                      </div>
                    )}
                    <div className="truncate">
                      <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                        <span className="truncate">{captain.riotId ?? captain.discordUsername}</span>
                        {captain.isVerified && <BadgeCheck size={14} className="shrink-0 text-success" />}
                        <span className="rounded bg-primary/20 px-1.5 py-0.2 text-[9px] font-bold uppercase text-primary">
                          Captain
                        </span>
                      </p>
                      <p className="text-[11px] text-foreground-muted">Team Lead</p>
                    </div>
                  </div>

                  {captain.trustScore !== null && (
                    <Badge variant={TRUST_VARIANT[trustTier(captain.trustScore)]}>
                      {captain.trustScore} Trust
                    </Badge>
                  )}
                </div>
              )}

              {/* Members */}
              {roster.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-sm border border-border bg-card p-3.5"
                >
                  <div className="flex items-center gap-3 truncate">
                    {player.discordAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={player.discordAvatar}
                        alt=""
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground-muted">
                        {player.riotId[0]}
                      </div>
                    )}
                    <div className="truncate">
                      <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                        <span className="truncate">{player.riotId}</span>
                        {player.isVerified && <BadgeCheck size={14} className="shrink-0 text-success" />}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {player.mainAgents?.map((a) => (
                          <span key={a} className="flex items-center gap-1 text-[11px] text-foreground-muted">
                            {AGENT_ICON[a] && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={AGENT_ICON[a]} alt="" width={12} height={12} className="h-3 w-3 rounded-full object-cover" />
                            )}
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Badge variant={TRUST_VARIANT[trustTier(player.trustScore)]}>
                    {player.trustScore} Trust
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Practice Schedule */}
          <div className="pt-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                <Clock size={13} /> Required Practice Schedule
              </h3>
              <span className="text-xs text-foreground-muted">
                {team.requiredHours?.length ?? 0} hrs/wk · UTC
              </span>
            </div>
            <AvailabilityStrip hours={team.requiredHours ?? []} />
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <ApplyTeamModal
        open={applyModalOpen}
        onOpenChange={setApplyModalOpen}
        team={team}
      />
    </div>
  );
}
