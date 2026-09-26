"use client";

import * as React from "react";
import { PlayCircle, BadgeCheck, History, MessageSquareQuote } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DIVISION_LABEL } from "@/lib/constants";
import { applicationApi } from "@/lib/api";
import { trustTier, type ApplicationHistoryEntry, type ScoutCard as ScoutCardData } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

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

  React.useEffect(() => {
    if (!showHistory || !applicationId) return;
    applicationApi.history(applicationId).then(setHistory).catch(() => setHistory([]));
  }, [showHistory, applicationId]);

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
