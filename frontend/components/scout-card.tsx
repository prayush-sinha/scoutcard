import { BadgeCheck, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIVISION_LABEL } from "@/lib/constants";
import { trustTier, type ScoutCard as ScoutCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

const TRUST_VARIANT = { high: "success", medium: "warning", low: "danger" } as const;

interface ScoutCardProps {
  card: ScoutCardData;
  onViewProfile?: (playerId: string) => void;
  onInvite?: (playerId: string) => void;
}

export function ScoutCard({ card, onViewProfile, onInvite }: ScoutCardProps) {
  const agentSlots = [card.mainAgents[0], card.mainAgents[1], card.flexAgent];

  return (
    <div className="flex flex-col rounded-sm border border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground">{card.riotId}</span>
            {card.isVerified && <BadgeCheck size={15} className="text-success" aria-label="Verified" />}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={TRUST_VARIANT[trustTier(card.trustScore)]}>{card.trustScore} Trust</Badge>
            {typeof card.scheduleOverlap === "number" && (
              <Badge variant="secondary" className="gap-1">
                <Flame size={11} className="text-primary" />
                {card.scheduleOverlapTotal
                  ? `${card.scheduleOverlap}/${card.scheduleOverlapTotal} hrs match`
                  : `${card.scheduleOverlap} hrs overlap`}
              </Badge>
            )}
          </div>
        </div>
        <Badge className="shrink-0 whitespace-nowrap">{DIVISION_LABEL[card.division]}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4">
        {agentSlots.map((agent, i) => (
          <div
            key={i}
            className={cn(
              "flex aspect-square flex-col items-center justify-center rounded-sm border text-center",
              agent ? "border-border bg-muted" : "border-dashed border-border/60 bg-transparent"
            )}
          >
            <span className="text-[10px] uppercase tracking-wide text-foreground-muted">{i < 2 ? "Main" : "Flex"}</span>
            <span className="mt-1 text-xs font-semibold text-foreground">{agent ?? "—"}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pb-4">
        {card.playstyleTags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-auto flex gap-2 border-t border-border p-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewProfile?.(card.id)}>
          View Full Profile
        </Button>
        <Button size="sm" className="flex-1" onClick={() => onInvite?.(card.id)}>
          Invite
        </Button>
      </div>
    </div>
  );
}
