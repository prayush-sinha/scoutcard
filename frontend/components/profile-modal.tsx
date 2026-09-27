"use client";

import * as React from "react";
import { PlayCircle, BadgeCheck, History, MessageSquareQuote, ExternalLink, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DIVISION_LABEL } from "@/lib/constants";
import { applicationApi, playerApi } from "@/lib/api";
import {
  trustTier,
  type ApplicationHistoryEntry,
  type ScoutCard as ScoutCardData,
  type PlayerTrackerStats,
} from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const TRUST_VARIANT = { high: "success", medium: "warning", low: "danger" } as const;

export interface Vouch {
  author: string;
  note: string;
}

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: ScoutCardData | null;
  scheduleMatchPercent?: number;
  applicationId?: string;
  vouches?: Vouch[];
}

function youTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export function ProfileModal({ open, onOpenChange, card, scheduleMatchPercent, applicationId, vouches = [] }: ProfileModalProps) {
  const [history, setHistory] = React.useState<ApplicationHistoryEntry[] | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);
  const [trackerStats, setTrackerStats] = React.useState<PlayerTrackerStats | null>(null);
  const [loadingTracker, setLoadingTracker] = React.useState(false);

  React.useEffect(() => {
    if (!showHistory || !applicationId) return;
    applicationApi.history(applicationId).then(setHistory).catch(() => setHistory([]));
  }, [showHistory, applicationId]);

  React.useEffect(() => {
    if (!open || !card?.id) {
      setTrackerStats(null);
      return;
    }
    setLoadingTracker(true);
    playerApi
      .getTrackerStats(card.id)
      .then(setTrackerStats)
      .catch(() => setTrackerStats(null))
      .finally(() => setLoadingTracker(false));
  }, [open, card?.id]);

  if (!card) return null;
  const embedUrl = card.vodUrl ? youTubeEmbedUrl(card.vodUrl) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <div>
            <DialogTitle>
              <span className="flex items-center gap-1.5">
                {card.riotId}
                {card.isVerified && <BadgeCheck size={16} className="text-success" />}
              </span>
            </DialogTitle>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge>{DIVISION_LABEL[card.division]}</Badge>
              <Badge variant={TRUST_VARIANT[trustTier(card.trustScore)]}>{card.trustScore} Trust Score</Badge>
              {card.playstyleTags.map((t) => (
                <Badge key={t} variant="secondary">{t}</Badge>
              ))}
            </div>
          </div>
          <DialogClose onClick={() => onOpenChange(false)} />
        </DialogHeader>

        {/* Tracker Network Live Stats */}
        <div className="mb-5 rounded-sm border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-success" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Tracker Network Verified Stats
              </h3>
            </div>
            {trackerStats?.trackerUrl && (
              <a
                href={trackerStats.trackerUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] font-medium text-primary transition-colors hover:underline"
              >
                <span>Full Profile</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          {loadingTracker ? (
            <div className="flex items-center justify-center py-6 text-xs text-foreground-muted">
              <span className="mr-2 animate-spin">⟳</span> Fetching live Tracker.gg statistics…
            </div>
          ) : trackerStats ? (
            <div className="space-y-3">
              {/* Top row: Current Rank & Peak Rank */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-sm border border-border/60 bg-muted/50 p-2.5">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                    Current Rank
                  </span>
                  <span className="text-sm font-bold text-foreground">{trackerStats.rank}</span>
                </div>
                <div className="rounded-sm border border-border/60 bg-muted/50 p-2.5">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                    Peak Rank
                  </span>
                  <span className="text-sm font-bold text-warning">{trackerStats.peakRank}</span>
                </div>
              </div>

              {/* Stats Grid: KD, Win Rate, Headshot %, ADR, Matches, Hours */}
              <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
                <div className="rounded-sm border border-border/40 bg-muted/30 p-2">
                  <span className="block text-[10px] uppercase text-foreground-muted">K/D</span>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      (trackerStats.kdRatio ?? 0) >= 1.2
                        ? "text-success"
                        : (trackerStats.kdRatio ?? 0) >= 1.0
                        ? "text-foreground"
                        : "text-danger"
                    )}
                  >
                    {trackerStats.kdRatio ? trackerStats.kdRatio.toFixed(2) : "—"}
                  </span>
                </div>
                <div className="rounded-sm border border-border/40 bg-muted/30 p-2">
                  <span className="block text-[10px] uppercase text-foreground-muted">Win Rate</span>
                  <span className="text-sm font-bold text-foreground">
                    {trackerStats.winRate}%
                  </span>
                </div>
                <div className="rounded-sm border border-border/40 bg-muted/30 p-2">
                  <span className="block text-[10px] uppercase text-foreground-muted">HS %</span>
                  <span className="text-sm font-bold text-foreground">
                    {trackerStats.headshotPct ? `${trackerStats.headshotPct}%` : "—"}
                  </span>
                </div>
                <div className="rounded-sm border border-border/40 bg-muted/30 p-2">
                  <span className="block text-[10px] uppercase text-foreground-muted">ADR</span>
                  <span className="text-sm font-bold text-foreground">
                    {trackerStats.damagePerRound ? Math.round(trackerStats.damagePerRound) : "—"}
                  </span>
                </div>
                <div className="rounded-sm border border-border/40 bg-muted/30 p-2">
                  <span className="block text-[10px] uppercase text-foreground-muted">Matches</span>
                  <span className="text-sm font-bold text-foreground">
                    {trackerStats.matchesPlayed}
                  </span>
                </div>
                <div className="rounded-sm border border-border/40 bg-muted/30 p-2">
                  <span className="block text-[10px] uppercase text-foreground-muted">Playtime</span>
                  <span className="text-sm font-bold text-foreground">
                    {trackerStats.hoursPlayed}h
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-foreground-muted">
              Tracker stats available upon Riot ID verification.
            </div>
          )}
        </div>

        {/* Agents */}
        {(card.mainAgents?.length > 0 || card.flexAgent) && (
          <div className="mb-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Agents</h3>
            <div className="flex flex-wrap items-center gap-2">
              {card.mainAgents?.map((agent) => (
                <span
                  key={agent}
                  className="flex items-center gap-1 rounded-sm border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                >
                  {agent}
                  <span className="ml-1 rounded-sm bg-primary/20 px-1 text-[9px] font-bold uppercase tracking-wider text-primary/80">
                    Main
                  </span>
                </span>
              ))}
              {card.flexAgent && (
                <span className="flex items-center gap-1 rounded-sm border border-warning/40 bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
                  {card.flexAgent}
                  <span className="ml-1 rounded-sm bg-warning/20 px-1 text-[9px] font-bold uppercase tracking-wider text-warning/80">
                    Flex
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* VOD "eye test" */}
        <div className="relative mb-5 aspect-video overflow-hidden rounded-sm border border-border bg-muted">
          {embedUrl ? (
            <iframe src={embedUrl} title="Player VOD" allowFullScreen className="h-full w-full" />
          ) : card.vodUrl ? (
            <a
              href={card.vodUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-full w-full flex-col items-center justify-center gap-2 text-foreground-muted transition-colors hover:text-foreground"
            >
              <PlayCircle size={40} />
              <span className="text-xs">Open VOD clip</span>
            </a>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-foreground-muted/50">
              <PlayCircle size={40} />
              <span className="text-xs">No VOD submitted</span>
            </div>
          )}
        </div>

        {typeof scheduleMatchPercent === "number" && (
          <div className="mb-5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wide text-foreground-muted">Availability Match</span>
              <span className="text-foreground">{Math.round(scheduleMatchPercent)}%</span>
            </div>
            <Progress value={scheduleMatchPercent} />
          </div>
        )}

        <div className="mb-5">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            <MessageSquareQuote size={13} /> Vouches
          </h3>
          {vouches.length === 0 ? (
            <p className="text-xs text-foreground-muted/70">No vouches yet.</p>
          ) : (
            <ul className="space-y-2">
              {vouches.map((v, i) => (
                <li key={i} className="rounded-sm border border-border bg-muted p-2.5 text-xs">
                  <span className="font-semibold text-foreground">{v.author}: </span>
                  <span className="text-foreground-muted">{v.note}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {applicationId && (
          <div>
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted hover:text-foreground"
            >
              <History size={13} /> {showHistory ? "Hide" : "View"} Audit History
            </button>
            {showHistory && (
              <ul className="space-y-1.5 border-l border-border pl-3">
                {(history ?? []).map((h) => (
                  <li key={h.id} className="text-xs text-foreground-muted">
                    <span className="text-foreground">{h.fromStatus ?? "New"} → {h.toStatus}</span>{" "}
                    · {timeAgo(h.changedAt)}
                    {h.note && <span className="block text-foreground-muted/70">{h.note}</span>}
                  </li>
                ))}
                {history?.length === 0 && <li className="text-xs text-foreground-muted/70">No status changes yet.</li>}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={() => onOpenChange(false)} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
