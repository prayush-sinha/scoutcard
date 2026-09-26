"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KANBAN_COLUMNS } from "@/lib/constants";
import type { Application, ApplicationStatus } from "@/lib/types";
import { ScoutCardCompact } from "@/components/scout-card-compact";
import { cn } from "@/lib/utils";

const COLUMN_ACCENT: Record<ApplicationStatus, string> = {
  Applied: "bg-foreground-muted",
  Reviewed: "bg-warning",
  Trialing: "bg-primary",
  Accepted: "bg-success",
  Rejected: "bg-danger",
};

function SortableCard({ application, onOpen }: { application: Application; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: application.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <ScoutCardCompact application={application} onClick={onOpen} />
    </div>
  );
}

export function KanbanColumn({
  status,
  applications,
  onOpenCard,
}: {
  status: ApplicationStatus;
  applications: Application[];
  onOpenCard: (application: Application) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const label = KANBAN_COLUMNS.find((c) => c.status === status)?.label ?? status;

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-sm border border-border bg-background/40">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <span className={cn("h-2 w-2 rounded-full", COLUMN_ACCENT[status])} />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">{label}</h3>
        <span className="ml-auto rounded-sm bg-muted px-1.5 py-0.5 text-[11px] text-foreground-muted">
          {applications.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 overflow-y-auto scroll-thin p-2 transition-colors",
          isOver && "bg-primary/5",
        )}
        style={{ minHeight: 120, maxHeight: "calc(100vh - 220px)" }}
      >
        <SortableContext items={applications.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {applications.map((app) => (
            <SortableCard key={app.id} application={app} onOpen={() => onOpenCard(app)} />
          ))}
        </SortableContext>
        {applications.length === 0 && (
          <p className="p-3 text-center text-[11px] text-foreground-muted/60">Drop a card here</p>
        )}
      </div>
    </div>
  );
}
