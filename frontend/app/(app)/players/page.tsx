"use client";

import * as React from "react";
import { FilterSidebar } from "@/components/filter-sidebar";
import { ScoutCard } from "@/components/scout-card";
import { ProfileModal } from "@/components/profile-modal";
import { playerApi, teamApi } from "@/lib/api";
import { overlapCount } from "@/lib/schedule";
import type { PlayerSearchFilters, ScoutCard as ScoutCardData } from "@/lib/types";

export default function LfgBoardPage() {
  const [filters, setFilters] = React.useState<PlayerSearchFilters>({});
  const [scheduleBlock, setScheduleBlock] = React.useState<number[]>([]);
  const [results, setResults] = React.useState<ScoutCardData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [myTeamId, setMyTeamId] = React.useState<string | undefined>();
  const [activeCard, setActiveCard] = React.useState<ScoutCardData | null>(null);

  // A captain sees the "Sort by Overlap" toggle, scoped to their own team.
  React.useEffect(() => {
    teamApi
      .myTeam()
      .then((team) => setMyTeamId(team.id))
      .catch(() => setMyTeamId(undefined));
  }, []);

  React.useEffect(() => {
    setLoading(true);
    // Captains get real scheduleOverlap (against their saved Team.requiredHours) attached by
    // the server whenever teamId is present — not just when sort=overlap. Pass it whenever we
    // have it, and don't let the client-side filter-block scratchpad below overwrite it.
    playerApi
      .search({ ...filters, teamId: myTeamId })
      .then((players) => {
        const withOverlap =
          myTeamId || scheduleBlock.length === 0
            ? players
            : players.map((p) => ({
                ...p,
                scheduleOverlap: overlapCount(p.availableHours, scheduleBlock),
                scheduleOverlapTotal: scheduleBlock.length,
              }));
        setResults(withOverlap);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [filters, scheduleBlock, myTeamId]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">LFG Board</h1>
        <p className="text-sm text-foreground-muted">Published Scout Cards matching your search.</p>
      </div>

      <div className="flex gap-8">
        <FilterSidebar
          filters={filters}
          onChange={setFilters}
          scheduleBlock={scheduleBlock}
          onScheduleBlockChange={setScheduleBlock}
          isCaptain={!!myTeamId}
        />

        <div className="flex-1">
          {loading ? (
            <p className="text-sm text-foreground-muted">Loading Scout Cards…</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-foreground-muted">No players match these filters yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((card) => (
                <ScoutCard key={card.id} card={card} onViewProfile={() => setActiveCard(card)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ProfileModal open={!!activeCard} onOpenChange={(open) => !open && setActiveCard(null)} card={activeCard} />
    </div>
  );
}
