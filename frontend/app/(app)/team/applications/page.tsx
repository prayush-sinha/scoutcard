"use client";

import * as React from "react";
import { KanbanBoard } from "@/components/kanban-board";
import { applicationApi, teamApi } from "@/lib/api";
import type { Application } from "@/lib/types";

export default function TeamApplicationsPage() {
  const [teamId, setTeamId] = React.useState<string | null>(null);
  const [applications, setApplications] = React.useState<Application[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    teamApi
      .myTeam()
      .then((team) => {
        setTeamId(team.id);
        return applicationApi.forTeam(team.id);
      })
      .then(setApplications)
      .catch(() => setError("You need a team to view its applicant board."));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Applications Board</h1>
        <p className="text-sm text-foreground-muted">Drag a card to move an applicant through your pipeline.</p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {!error && (!teamId || !applications) && <p className="text-sm text-foreground-muted">Loading board…</p>}
      {teamId && applications && <KanbanBoard teamId={teamId} initialApplications={applications} />}
    </div>
  );
}
