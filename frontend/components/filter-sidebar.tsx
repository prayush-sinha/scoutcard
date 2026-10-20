"use client";

import * as React from "react";
import {
  Megaphone,
  Swords,
  Footprints,
  HeartHandshake,
  Anchor as AnchorIcon,
  ShieldCheck,
  RotateCcw,
  Users,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ScheduleGrid } from "@/components/schedule-grid";
import {
  PREMIER_DIVISIONS,
  DIVISION_LABEL,
  PLAYSTYLE_TAGS,
  PLAYSTYLE_LABEL,
  AGENTS,
  AGENT_ICON,
} from "@/lib/constants";
import type { PlaystyleTag, PlayerSearchFilters, PremierDivision } from "@/lib/types";

const TAG_ICON: Record<PlaystyleTag, React.ReactNode> = {
  IGL: <Megaphone size={13} />,
  Entry: <Swords size={13} />,
  Lurk: <Footprints size={13} />,
  Support: <HeartHandshake size={13} />,
  Anchor: <AnchorIcon size={13} />,
};

interface FilterSidebarProps {
  filters: PlayerSearchFilters;
  onChange: (filters: PlayerSearchFilters) => void;
  scheduleBlock: number[];
  onScheduleBlockChange: (hours: number[]) => void;
  /** Only a logged-in team captain can sort by schedule overlap against their own team. */
  isCaptain?: boolean;
  className?: string;
  onCloseMobile?: () => void;
}

export function FilterSidebar({
  filters,
  onChange,
  scheduleBlock,
  onScheduleBlockChange,
  isCaptain,
  className,
  onCloseMobile,
}: FilterSidebarProps) {
  const hasActiveFilters =
    !!filters.division ||
    (filters.tags && filters.tags.length > 0) ||
    (filters.agents && filters.agents.length > 0) ||
    !!filters.verified ||
    filters.sort === "overlap" ||
    scheduleBlock.length > 0;

  const resetFilters = () => {
    onChange({});
    onScheduleBlockChange([]);
  };

  return (
    <aside className={className ?? "w-72 shrink-0 space-y-6"}>
      {/* Header with Reset */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Filter Players</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            <RotateCcw size={11} /> Reset all
          </button>
        )}
      </div>

      {/* Target Division */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Premier Division</h3>
        <Select
          value={filters.division}
          onValueChange={(v) => onChange({ ...filters, division: (v || undefined) as PremierDivision | undefined })}
          placeholder="Any division"
          options={PREMIER_DIVISIONS.map((d) => ({ value: d, label: DIVISION_LABEL[d] }))}
        />
      </div>

      {/* Agent Filter with Icons */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Agent Pool</h3>
          {filters.agents && filters.agents.length > 0 && (
            <span className="text-[10px] text-primary font-semibold">{filters.agents.length} selected</span>
          )}
        </div>
        <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto scroll-thin pr-1">
          {AGENTS.map((agent) => {
            const isSelected = filters.agents?.includes(agent);
            const icon = AGENT_ICON[agent];
            return (
              <button
                key={agent}
                type="button"
                onClick={() => {
                  const current = filters.agents ?? [];
                  const next = isSelected ? current.filter((a) => a !== agent) : [...current, agent];
                  onChange({ ...filters, agents: next.length > 0 ? next : undefined });
                }}
                className={`flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[11px] font-medium transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/20 text-foreground ring-1 ring-primary"
                    : "border-border bg-muted/60 text-foreground-muted hover:border-foreground-muted/40 hover:text-foreground"
                }`}
              >
                {icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={icon} alt="" width={14} height={14} className="h-3.5 w-3.5 rounded-full object-cover" />
                )}
                <span>{agent}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-[10px] text-foreground-muted">Players must main at least one selected agent</p>
      </div>

      {/* Playstyle Tags */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Playstyle Tags</h3>
        <ToggleGroup
          type="multiple"
          value={filters.tags ?? []}
          onValueChange={(tags) => onChange({ ...filters, tags: (tags.length ? tags : undefined) as PlaystyleTag[] | undefined })}
          items={PLAYSTYLE_TAGS.map((t) => ({ value: t, label: t, icon: TAG_ICON[t] }))}
        />
        <p className="mt-1 text-[11px] text-foreground-muted">
          {PLAYSTYLE_LABEL[filters.tags?.[0] as PlaystyleTag] ?? "Any playstyle role"}
        </p>
      </div>

      {/* Verified Only */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Verified Players Only</h3>
        <Switch checked={!!filters.verified} onCheckedChange={(v) => onChange({ ...filters, verified: v || undefined })} />
      </div>

      {/* Captain: Sort by Overlap */}
      {isCaptain && (
        <div className="flex items-center justify-between gap-2 rounded-sm border border-border bg-muted/40 p-2.5">
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
              <ShieldCheck size={13} className="text-success" /> Sort by Overlap
            </h3>
            <p className="text-[10px] text-foreground-muted">Prioritize players matching your team hours</p>
          </div>
          <Switch
            checked={filters.sort === "overlap"}
            onCheckedChange={(v) => onChange({ ...filters, sort: v ? "overlap" : "recent" })}
          />
        </div>
      )}

      {/* Required Schedule */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Required Schedule</h3>
        <ScheduleGrid mode="block" value={scheduleBlock} onChange={onScheduleBlockChange} />
        <p className="mt-2 text-[11px] leading-relaxed text-foreground-muted">
          Highlight practice windows. Cards display an overlap badge matching these hours.
        </p>
      </div>

      {onCloseMobile && (
        <div className="pt-2 lg:hidden">
          <Button onClick={onCloseMobile} className="w-full">
            Apply Filters
          </Button>
        </div>
      )}
    </aside>
  );
}
