import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DIVISION_LABEL } from "@/lib/constants";
import { trustTier, type Application } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

const TRUST_VARIANT = { high: "success", medium: "warning", low: "danger" } as const;

/** Condensed Scout Card used inside Kanban columns — every pixel earns its place. */
export function ScoutCardCompact({ application, onClick }: { application: Application; onClick?: () => void }) {
  const p = application.player;

  return (
    <button
      onClick={onClick}
      className="w-full cursor-grab space-y-2 rounded-sm border border-border bg-card p-3 text-left transition-colors hover:border-foreground-muted/40 active:cursor-grabbing"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 truncate">
          {p?.discordAvatar ? (
            <Image src={p.discordAvatar} alt="" width={20} height={20} className="rounded-sm" />
          ) : (
            <div className="h-5 w-5 rounded-sm bg-muted" />
          )}
          <span className="truncate text-sm font-semibold text-foreground">{p?.riotId ?? "Unknown Player"}</span>
          {p?.isVerified && <BadgeCheck size={13} className="shrink-0 text-success" />}
        </div>
        {p && <Badge variant={TRUST_VARIANT[trustTier(p.trustScore)]}>{p.trustScore}</Badge>}
      </div>

      <div className="flex flex-wrap items-center gap-1 text-[11px] text-foreground-muted">
        {p && <span>{DIVISION_LABEL[p.division]}</span>}
        {p?.mainAgents.map((a) => (
          <span key={a} className="rounded-sm bg-muted px-1.5 py-0.5">
            {a}
          </span>
        ))}
      </div>

      {application.message && (
        <p className="line-clamp-2 text-xs text-foreground-muted">{application.message}</p>
      )}

      <p className="text-[10px] text-foreground-muted/70">{timeAgo(application.updatedAt)}</p>
    </button>
  );
}
