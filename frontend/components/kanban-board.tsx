"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KANBAN_COLUMNS, canTransition } from "@/lib/constants";
import { applicationApi } from "@/lib/api";
import { useApplicationSocket } from "@/hooks/useApplicationSocket";
import type { Application, ApplicationStatus } from "@/lib/types";
import { KanbanColumn } from "@/components/kanban-column";
import { ScoutCardCompact } from "@/components/scout-card-compact";
import { ProfileModal } from "@/components/profile-modal";

type ColumnMap = Record<ApplicationStatus, Application[]>;

function groupByStatus(applications: Application[]): ColumnMap {
  const map = Object.fromEntries(KANBAN_COLUMNS.map((c) => [c.status, [] as Application[]])) as ColumnMap;
  for (const app of applications) map[app.status].push(app);
  return map;
}

export function KanbanBoard({ teamId, initialApplications }: { teamId: string; initialApplications: Application[] }) {
  const [columns, setColumns] = React.useState<ColumnMap>(() => groupByStatus(initialApplications));
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [openApplication, setOpenApplication] = React.useState<Application | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Real-time board updates — new applications land in "Applied", status moves reflect instantly.
  useApplicationSocket(teamId, (payload) => {
    if (payload.event === "application:created") {
      const { data } = payload;
      setColumns((prev) => ({
        ...prev,
        Applied: [
          {
            id: data.applicationId,
            playerId: data.playerId,
            teamId,
            status: "Applied",
            message: null,
            captainNotes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            player: undefined,
          },
          ...prev.Applied,
        ],
      }));
      setToast(`New application from ${data.playerName}`);
    }
    if (payload.event === "application:status_changed") {
      const { data } = payload;
      setColumns((prev) => {
        const from = prev[data.fromStatus as ApplicationStatus] ?? [];
        const moved = from.find((a) => a.id === data.applicationId);
        if (!moved) return prev;
        const toStatus = data.toStatus as ApplicationStatus;
        return {
          ...prev,
          [data.fromStatus]: from.filter((a) => a.id !== data.applicationId),
          [toStatus]: [{ ...moved, status: toStatus }, ...prev[toStatus]],
        };
      });
    }
    if (payload.event === "notification:new") {
      setToast(payload.data.message);
    }
  });

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const findContainer = (id: string): ApplicationStatus | undefined => {
    if ((KANBAN_COLUMNS as { status: string }[]).some((c) => c.status === id)) return id as ApplicationStatus;
    return (Object.keys(columns) as ApplicationStatus[]).find((status) => columns[status].some((a) => a.id === id));
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(over.id));
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    // Visual-only preview move — the real validity check (and any revert) happens on drop,
    // against the application's *original* status, not wherever it's been dragged through.
    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const moving = activeItems.find((a) => a.id === active.id);
      if (!moving) return prev;
      return {
        ...prev,
        [activeContainer]: activeItems.filter((a) => a.id !== active.id),
        [overContainer]: [{ ...moving, status: overContainer }, ...prev[overContainer]],
      };
    });
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const finalContainer = findContainer(String(over.id));
    if (!finalContainer) return;

    const original = initialApplications.find((a) => a.id === active.id)?.status;
    if (!original || original === finalContainer) return;

    // Enforce the same transition graph as application.service.ts client-side, so an
    // invalid drop (e.g. Applied straight to Accepted) reverts instantly instead of
    // waiting on a 400 from the server.
    if (!canTransition(original, finalContainer)) {
      setToast(`Can't move an application straight from ${original} to ${finalContainer}.`);
      setColumns(groupByStatus(initialApplications));
      return;
    }

    try {
      await applicationApi.updateStatus(String(active.id), finalContainer);
    } catch {
      setToast("Couldn't update status — reverting.");
      setColumns(groupByStatus(initialApplications));
    }
  };

  const activeApplication = activeId
    ? Object.values(columns).flat().find((a) => a.id === activeId)
    : null;

  return (
    <div>
      {toast && (
        <div className="mb-4 rounded-sm border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm text-foreground">
          {toast}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto scroll-thin pb-4">
          {KANBAN_COLUMNS.map(({ status }) => (
            <KanbanColumn key={status} status={status} applications={columns[status]} onOpenCard={setOpenApplication} />
          ))}
        </div>

        <DragOverlay>
          {activeApplication ? <ScoutCardCompact application={activeApplication} /> : null}
        </DragOverlay>
      </DndContext>

      <ProfileModal
        open={!!openApplication}
        onOpenChange={(open) => !open && setOpenApplication(null)}
        card={
          openApplication?.player
            ? {
                id: openApplication.playerId,
                riotId: openApplication.player.riotId,
                discordUsername: openApplication.player.discordUsername,
                discordAvatar: openApplication.player.discordAvatar,
                isVerified: openApplication.player.isVerified,
                trustScore: openApplication.player.trustScore,
                division: openApplication.player.division,
                mainAgents: openApplication.player.mainAgents,
                flexAgent: null, // the captain's applicant-list select doesn't include this field
                playstyleTags: openApplication.player.playstyleTags,
                vodUrl: null,
                availableHours: [],
                isPublished: true,
              }
            : null
        }
        applicationId={openApplication?.id}
      />
    </div>
  );
}
