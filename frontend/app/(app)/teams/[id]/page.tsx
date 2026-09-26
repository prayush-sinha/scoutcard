"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DIVISION_LABEL, VALORANT_ROLE_LABEL } from "@/lib/constants";
import { teamApi } from "@/lib/api";
import type { Team } from "@/lib/types";

export default function PublicTeamProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = React.useState<Team | null>(null);

  React.useEffect(() => {
    teamApi.getById(id).then(setTeam).catch(() => setTeam(null));
  }, [id]);

  if (!team) return <p className="text-sm text-foreground-muted">Loading team…</p>;

  return (
    <div className="max-w-2xl rounded-sm border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{team.name}</h1>
        {team.division && <Badge>{DIVISION_LABEL[team.division]}</Badge>}
      </div>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Recruiting</h3>
      <div className="mb-6 flex flex-wrap gap-1.5">
        {team.recruitingRoles.length === 0 ? (
          <p className="text-xs text-foreground-muted/70">Not currently listing open roles.</p>
        ) : (
          team.recruitingRoles.map((r) => (
            <Badge key={r} variant="secondary">
              {VALORANT_ROLE_LABEL[r]}
            </Badge>
          ))
        )}
      </div>

      {team.roster && team.roster.length > 0 && (
        <>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Roster</h3>
          <ul className="space-y-1.5">
            {team.roster.map((m) => (
              <li key={m.id} className="flex items-center gap-1.5 text-sm text-foreground">
                {m.riotId}
                {m.isVerified && <BadgeCheck size={13} className="text-success" />}
                <span className="text-xs text-foreground-muted">{DIVISION_LABEL[m.division]}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
