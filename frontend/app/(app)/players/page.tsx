"use client";

import * as React from "react";
import { SlidersHorizontal, Search, RotateCcw, X, ShieldAlert } from "lucide-react";
import { FilterSidebar } from "@/components/filter-sidebar";
import { ScoutCard } from "@/components/scout-card";
import { ScoutCardSkeleton } from "@/components/scout-card-skeleton";
import { ProfileModal } from "@/components/profile-modal";
import { Button } from "@/components/ui/button";
import { playerApi, teamApi } from "@/lib/api";
import { overlapCount } from "@/lib/schedule";
import { DIVISION_LABEL, AGENT_ICON } from "@/lib/constants";
import type { PlayerSearchFilters, ScoutCard as ScoutCardData } from "@/lib/types";

export default function LfgBoardPage() {
  const [filters, setFilters] = React.useState<PlayerSearchFilters>({});
  const [scheduleBlock, setScheduleBlock] = React.useState<number[]>([]);
  const [results, setResults] = React.useState<ScoutCardData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [myTeamId, setMyTeamId] = React.useState<string | undefined>();
  const [activeCard, setActiveCard] = React.useState<ScoutCardData | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

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
    // the server whenever teamId is present — not just when sort=overlap.
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

  const activeFilterCount =
    (filters.division ? 1 : 0) +
    (filters.tags?.length ?? 0) +
    (filters.agents?.length ?? 0) +
    (filters.verified ? 1 : 0) +
    (filters.sort === "overlap" ? 1 : 0) +
    (scheduleBlock.length > 0 ? 1 : 0);

  const resetAllFilters = () => {
    setFilters({});
    setScheduleBlock([]);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-wide text-foreground sm:text-3xl">
            LFG Board
          </h1>
          <p className="text-xs text-foreground-muted">
            Verified Valorant Premier players seeking teams. Filter by rank, role, agents, and practice schedule.
          </p>
        </div>

        {/* Mobile Filter Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetAllFilters} className="text-xs text-foreground-muted">
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Active Filter Pills Bar */}
      {activeFilterCount > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-3 text-xs">
          <span className="text-foreground-muted">Active:</span>

          {filters.division && (
            <span className="flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 text-foreground">
              {DIVISION_LABEL[filters.division]}
              <button
                onClick={() => setFilters((f) => ({ ...f, division: undefined }))}
                className="hover:text-primary"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.agents?.map((a) => (
            <span key={a} className="flex items-center gap-1.5 rounded-sm bg-muted px-2 py-0.5 text-foreground">
              {AGENT_ICON[a] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={AGENT_ICON[a]} alt="" width={12} height={12} className="h-3 w-3 rounded-full object-cover" />
              )}
              {a}
              <button
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    agents: f.agents?.filter((agent) => agent !== a),
                  }))
                }
                className="hover:text-primary"
              >
                <X size={12} />
              </button>
            </span>
          ))}

          {filters.tags?.map((t) => (
            <span key={t} className="flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 text-foreground">
              {t}
              <button
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    tags: f.tags?.filter((tag) => tag !== t),
                  }))
                }
                className="hover:text-primary"
              >
                <X size={12} />
              </button>
            </span>
          ))}

          {filters.verified && (
            <span className="flex items-center gap-1 rounded-sm bg-success/15 px-2 py-0.5 text-success">
              Verified Only
              <button
                onClick={() => setFilters((f) => ({ ...f, verified: undefined }))}
                className="hover:text-foreground"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.sort === "overlap" && (
            <span className="flex items-center gap-1 rounded-sm bg-primary/15 px-2 py-0.5 text-primary">
              Sorted by Schedule Overlap
              <button
                onClick={() => setFilters((f) => ({ ...f, sort: "recent" }))}
                className="hover:text-foreground"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {scheduleBlock.length > 0 && (
            <span className="flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 text-foreground">
              {scheduleBlock.length} hrs filter block
              <button onClick={() => setScheduleBlock([])} className="hover:text-primary">
                <X size={12} />
              </button>
            </span>
          )}

          <button
            onClick={resetAllFilters}
            className="ml-auto text-[11px] font-medium text-primary hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Layout: Desktop Sidebar + Player Cards Grid */}
      <div className="flex items-start gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            scheduleBlock={scheduleBlock}
            onScheduleBlockChange={setScheduleBlock}
            isCaptain={!!myTeamId}
            className="w-72 shrink-0 space-y-6 border-r border-border pr-6"
          />
        </div>

        {/* Player Grid / Skeletons / Empty State */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ScoutCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-card/50 p-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Search size={24} className="text-foreground-muted" />
              </div>
              <h3 className="font-display text-xl font-bold uppercase tracking-wider text-foreground">
                No Players Found
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-foreground-muted">
                No published Scout Cards match your current filter criteria. Try broadening your division, selecting
                additional agents, or clearing schedule requirements.
              </p>
              {activeFilterCount > 0 ? (
                <Button onClick={resetAllFilters} variant="outline" size="sm" className="mt-5">
                  <RotateCcw size={13} /> Reset Filters
                </Button>
              ) : (
                <div className="mt-5 flex items-center gap-2 rounded-sm bg-muted/60 px-3 py-2 text-xs text-foreground-muted">
                  <ShieldAlert size={14} className="text-warning" />
                  Be the first to publish a card in your division!
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between text-xs text-foreground-muted">
                <span>
                  Showing <span className="font-semibold text-foreground">{results.length}</span> verified player
                  {results.length === 1 ? "" : "s"}
                </span>
                {filters.sort === "overlap" && (
                  <span className="font-medium text-success">Ranked by practice overlap</span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((card) => (
                  <ScoutCard key={card.id} card={card} onViewProfile={() => setActiveCard(card)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Slide-over / Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 h-full w-full max-w-xs overflow-y-auto border-l border-border bg-card p-6 shadow-2xl scroll-thin">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <span className="font-display text-lg font-bold uppercase text-foreground">Filters</span>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="rounded-sm p-1 text-foreground-muted hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              scheduleBlock={scheduleBlock}
              onScheduleBlockChange={setScheduleBlock}
              isCaptain={!!myTeamId}
              className="space-y-6"
              onCloseMobile={() => setMobileFilterOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Full Profile Modal */}
      <ProfileModal open={!!activeCard} onOpenChange={(open) => !open && setActiveCard(null)} card={activeCard} />
    </div>
  );
}
