"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { applicationApi } from "@/lib/api";
import { useApplicationSocket } from "@/hooks/useApplicationSocket";
import type { Application, ApplicationStatus } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

const STATUS_VARIANT: Record<ApplicationStatus, "secondary" | "warning" | "default" | "success" | "danger"> = {
  Applied: "secondary",
  Reviewed: "warning",
  Trialing: "default",
  Accepted: "success",
  Rejected: "danger",
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [toast, setToast] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => {
    applicationApi.myApplications().then(setApplications).catch(() => setApplications([]));
  }, []);

  React.useEffect(refresh, [refresh]);

  // No teamId — this just listens for the player's own notification room.
  useApplicationSocket(undefined, (payload) => {
    if (payload.event === "notification:new") {
      setToast(payload.data.message);
      refresh();
    }
  });

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const withdraw = async (id: string) => {
    await applicationApi.withdraw(id);
    refresh();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-foreground">My Applications</h1>
      <p className="mb-6 text-sm text-foreground-muted">Live status of every team you've applied to.</p>

      {toast && (
        <div className="mb-4 rounded-sm border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm text-foreground">
          {toast}
        </div>
      )}

      {applications.length === 0 ? (
        <p className="text-sm text-foreground-muted">You haven't applied to any teams yet.</p>
      ) : (
        <ul className="space-y-2">
          {applications.map((app) => (
            <li
              key={app.id}
              className="flex items-center justify-between gap-3 rounded-sm border border-border bg-card p-4"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{app.team?.name ?? `Team #${app.teamId.slice(0, 8)}`}</p>
                <p className="text-xs text-foreground-muted">Applied {timeAgo(app.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[app.status]}>{app.status}</Badge>
                {app.status === "Applied" && (
                  <Button variant="ghost" size="icon" onClick={() => withdraw(app.id)} aria-label="Withdraw">
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
