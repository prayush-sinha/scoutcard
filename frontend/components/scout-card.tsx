import { BadgeCheck, Flame } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AvailabilityStrip } from "@/components/availability-strip";
import { DIVISION_LABEL, PLAYSTYLE_LABEL, AGENT_ICON } from "@/lib/constants";
import { trustTier, type ScoutCard as ScoutCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIER_STYLE = {
  high:   { text: "text-success", label: "High trust" },
  medium: { text: "text-warning", label: "Moderate"   },
  low:    { text: "text-danger",  label: "Low trust"   },
} as const;

interface ScoutCardProps {
  card: ScoutCardData;
  onViewProfile?: (playerId: string) => void;
  onInvite?: (playerId: string) => void;
  className?: string;
}

/** Agent tile — portrait icon if available, abbreviated name fallback. */
function AgentTile({ name, slot }: { name: string | null | undefined; slot: string }) {
  const iconUrl = name ? AGENT_ICON[name] : null;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-end rounded-sm border overflow-hidden relative",
        name ? "border-border bg-muted" : "border-dashed border-border/60 bg-transparent"
      )}
      style={{ aspectRatio: "1 / 1.1" }}
    >
      {iconUrl ? (
        <Image
          src={iconUrl}
          alt={name ?? ""}
          fill
          sizes="80px"
          className="object-cover object-top"
          unoptimized
        />
      ) : (
        <span className="font-display absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground-muted">
          {name ? name.slice(0, 2).toUpperCase() : "—"}
        </span>
      )}
      {/* Label bar */}
      <div className="relative z-10 w-full bg-background/80 px-1 py-0.5 text-center backdrop-blur-sm">
        <p className="truncate text-[11px] font-semibold leading-tight text-foreground">
          {name ?? "Open"}
        </p>
        <p className="text-[9px] uppercase tracking-wide text-foreground-muted">{slot}</p>
      </div>
    </div>
  );
}

/** The product's signature object: one verified player, readable in about five seconds. */
export function ScoutCard({ card, onViewProfile, onInvite, className }: ScoutCardProps) {
  const tier = TIER_STYLE[trustTier(card.trustScore)];
  const hasActions = !!onViewProfile || !!onInvite;

  // Up to 4 main slots displayed; flex shown separately if present
  const mainSlots = Array.from({ length: Math.max(card.mainAgents.length, 2) }, (_, i) => ({
    name: card.mainAgents[i] ?? null,
    slot: "Main",
  }));

  return (
    <article className={cn("clip-notch bg-border p-px", className)}>
      <div className="clip-notch flex h-full flex-col bg-card">

        {/* ── Header: avatar / Riot ID / Trust score ── */}
        <header className="flex items-start gap-3 p-4 pb-3">
          {card.discordAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.discordAvatar}
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-sm object-cover"
            />
          ) : (
            <span className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-muted text-xl font-bold text-foreground-muted">
              {card.riotId[0]?.toUpperCase()}
            </span>
          )}

          <div className="min-w-0 flex-1 pr-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {DIVISION_LABEL[card.division]}
            </p>
            <h3 className="flex items-center gap-1.5 text-lg font-semibold leading-tight text-foreground">
              <span className="truncate">{card.riotId}</span>
              {card.isVerified && (
                <BadgeCheck size={16} className="shrink-0 text-success" aria-label="Verified via Tracker.gg" />
              )}
            </h3>
          </div>

          <div className="shrink-0 pt-4 text-right leading-none">
            <p className={cn("font-display text-4xl font-extrabold tabular-nums", tier.text)}>
              {card.trustScore}
            </p>
            <p className="mt-1 text-xs text-foreground-muted">{tier.label}</p>
          </div>
        </header>

        {/* ── Schedule overlap banner (captain view only) ── */}
        {typeof card.scheduleOverlap === "number" && (
          <p className="mx-4 mb-3 flex items-center gap-1.5 rounded-sm bg-success/10 px-2.5 py-1.5 text-[13px] font-medium text-success">
            <Flame size={14} />
            {card.scheduleOverlapTotal
              ? `Covers ${card.scheduleOverlap} of ${card.scheduleOverlapTotal} hours you need`
              : `${card.scheduleOverlap} hours overlap with your team`}
          </p>
        )}

        {/* ── Agent grid: mains row + optional flex ── */}
        <div className="space-y-2 px-4">
          {/* Main agents — dynamic count */}
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${mainSlots.length}, minmax(0, 1fr))` }}
          >
            {mainSlots.map((a, i) => (
              <AgentTile key={i} name={a.name} slot="Main" />
            ))}
          </div>

          {/* Flex agent — only shown if filled */}
          {card.flexAgent && (
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <AgentTile name={card.flexAgent} slot="Flex" />
              </div>
              <div className="col-span-3 flex items-center">
                <p className="text-xs text-foreground-muted">
                  Can flex to{" "}
                  <span className="font-semibold text-foreground">{card.flexAgent}</span> if needed
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Playstyle tags ── */}
        <p className="px-4 pt-3 text-[13px] text-foreground-muted">
          {card.playstyleTags.map((t) => PLAYSTYLE_LABEL[t]).join(" · ")}
        </p>

        {/* ── Availability strip ── */}
        <div className="px-4 pb-4 pt-3">
          <div className="mb-1.5 flex items-baseline justify-between text-xs text-foreground-muted">
            <span>Weekly availability</span>
            <span>{card.availableHours.length} hrs · UTC</span>
          </div>
          <AvailabilityStrip hours={card.availableHours} />
        </div>

        {/* ── Action buttons ── */}
        {hasActions && (
          <footer className="mt-auto flex gap-2 border-t border-border p-3">
            {onViewProfile && (
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewProfile(card.id)}>
                Full profile
              </Button>
            )}
            {onInvite && (
              <Button size="sm" className="flex-1" onClick={() => onInvite(card.id)}>
                Invite
              </Button>
            )}
          </footer>
        )}
      </div>
    </article>
  );
}
