"use client";

import * as React from "react";
import Image from "next/image";
import { BadgeCheck, Users, Clock, ShieldCheck, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvailabilityStrip } from "@/components/availability-strip";
import { DIVISION_LABEL, VALORANT_ROLE_LABEL, AGENT_ICON } from "@/lib/constants";
import { trustTier, type Team } from "@/lib/types";
import { cn } from "@/lib/utils";

const TRUST_VARIANT = { high: "success", medium: "warning", low: "danger" } as const;

interface TeamProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  onApplyClick?: (team: Team) => void;
}

export function TeamProfileModal({ open, onOpenChange, team, onApplyClick }: TeamProfileModalProps) {
  if (!team) return null;

  const roster = team.roster ?? [];
  const captain = team.captain;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto p-6 scroll-thin">
        <DialogHeader>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Team Dossier</span>
              {team.isActivelyRecruiting && (
                <span className="rounded-full bg-success/20 px-2 py-0.5 text-[9px] font-bold uppercase text-success">
                  Recruiting
                </span>
              )}
            </div>
            <DialogTitle className="mt-1 text-2xl font-black uppercase tracking-wide">
              {team.name}
            </DialogTitle>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {team.division && <Badge>{DIVISION_LABEL[team.division]}</Badge>}
              <span className="text-xs text-foreground-muted">
                {roster.length} / 5 Confirmed Roster
              </span>
            </div>
          </div>
          <DialogClose onClick={() => onOpenChange(false)} />
        </DialogHeader>

        {/* Roles Needed Section */}
        <div className="mb-6 rounded-sm border border-border bg-card p-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
            Open Roles Needed
          </h3>
          {team.recruitingRoles && team.recruitingRoles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {team.recruitingRoles.map((r) => (
                <span
                  key={r}
                  className="rounded-sm border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                >
                  {VALORANT_ROLE_LABEL[r]}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-foreground-muted">No specific roles listed.</p>
          )}
        </div>

        {/* Captain & Roster Members */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Active Roster ({roster.length + (captain ? 1 : 0)} players)
            </h3>
          </div>

          <div className="space-y-2">
            {/* Captain Row */}
            {captain && (
              <div className="flex items-center justify-between rounded-sm border border-border bg-muted/40 p-3">
                <div className="flex items-center gap-2.5 truncate">
                  {captain.discordAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={captain.discordAvatar}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full object-cover ring-1 ring-primary/40"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {captain.riotId?.[0] ?? "?"}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <span className="truncate">{captain.riotId ?? captain.discordUsername}</span>
                      {captain.isVerified && <BadgeCheck size={13} className="shrink-0 text-success" />}
                      <span className="rounded bg-primary/20 px-1 py-0.2 text-[9px] font-bold uppercase text-primary">
                        Captain
                      </span>
                    </p>
                    <p className="text-[10px] text-foreground-muted">Team Lead</p>
                  </div>
                </div>

                {captain.trustScore !== null && (
                  <Badge variant={TRUST_VARIANT[trustTier(captain.trustScore)]}>
                    {captain.trustScore} Trust
                  </Badge>
                )}
              </div>
            )}

            {/* Roster Members */}
            {roster.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-sm border border-border bg-card p-3"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {player.discordAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={player.discordAvatar}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground-muted">
                      {player.riotId[0]}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <span className="truncate">{player.riotId}</span>
                      {player.isVerified && <BadgeCheck size={13} className="shrink-0 text-success" />}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1">
                      {player.mainAgents?.map((a) => (
                        <span key={a} className="flex items-center gap-1 text-[10px] text-foreground-muted">
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

            {roster.length === 0 && !captain && (
              <p className="py-2 text-center text-xs text-foreground-muted">Roster currently empty.</p>
            )}
          </div>
        </div>

        {/* Practice Schedule */}
        <div className="mb-6 rounded-sm border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground-muted">
              <Clock size={13} /> Required Practice Schedule
            </h3>
            <span className="text-xs text-foreground-muted">
              {team.requiredHours?.length ?? 0} hrs / wk · UTC
            </span>
          </div>
          <AvailabilityStrip hours={team.requiredHours ?? []} />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onApplyClick && (
            <Button
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onApplyClick(team);
              }}
            >
              <Send size={13} /> Apply with Scout Card
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
