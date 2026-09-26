"use client";

import * as React from "react";
import { Megaphone, Swords, Footprints, HeartHandshake, Anchor as AnchorIcon, ShieldCheck } from "lucide-react";
import { Select } from "@/components/ui/select";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { ScheduleGrid } from "@/components/schedule-grid";
import { PREMIER_DIVISIONS, DIVISION_LABEL, PLAYSTYLE_TAGS, PLAYSTYLE_LABEL } from "@/lib/constants";
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
}

export function FilterSidebar({ filters, onChange, scheduleBlock, onScheduleBlockChange, isCaptain }: FilterSidebarProps) {
  return (
    <aside className="w-72 shrink-0 space-y-6 border-r border-border pr-6">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Target Division</h3>
        <Select
          value={filters.division}
          onValueChange={(v) => onChange({ ...filters, division: (v || undefined) as PremierDivision | undefined })}
          placeholder="Any division"
          options={PREMIER_DIVISIONS.map((d) => ({ value: d, label: DIVISION_LABEL[d] }))}
        />
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Playstyle Tags</h3>
        <ToggleGroup
          type="multiple"
          value={filters.tags ?? []}
          onValueChange={(tags) => onChange({ ...filters, tags: tags as PlaystyleTag[] })}
          items={PLAYSTYLE_TAGS.map((t) => ({ value: t, label: t, icon: TAG_ICON[t] }))}
        />
        <p className="mt-1 text-[11px] text-foreground-muted">{PLAYSTYLE_LABEL[filters.tags?.[0] as PlaystyleTag] ?? "Select up to any combination of roles"}</p>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Verified Only</h3>
        <Switch checked={!!filters.verified} onCheckedChange={(v) => onChange({ ...filters, verified: v })} />
      </div>

      {isCaptain && (
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            <ShieldCheck size={13} /> Sort by Overlap
          </h3>
          <Switch
            checked={filters.sort === "overlap"}
            onCheckedChange={(v) => onChange({ ...filters, sort: v ? "overlap" : "recent" })}
          />
        </div>
      )}

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Required Schedule</h3>
        <ScheduleGrid mode="block" value={scheduleBlock} onChange={onScheduleBlockChange} />
        <p className="mt-2 text-[11px] leading-relaxed text-foreground-muted">
          Highlight the blocks your team needs covered. Cards show a match badge for players whose
          availability overlaps.
        </p>
      </div>
    </aside>
  );
}
