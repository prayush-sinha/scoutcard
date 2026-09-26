"use client";

import * as React from "react";
import { Select } from "@/components/ui/select";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ScheduleGrid } from "@/components/schedule-grid";
import { PREMIER_DIVISIONS, DIVISION_LABEL, VALORANT_ROLES } from "@/lib/constants";
import { teamApi } from "@/lib/api";
import type { PremierDivision, TeamPayload, ValorantRole } from "@/lib/types";

export default function TeamSettingsPage() {
  const [teamId, setTeamId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<TeamPayload>({ recruitingRoles: [], requiredHours: [], isActivelyRecruiting: true });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    teamApi
      .myTeam()
      .then((t) => {
        setTeamId(t.id);
        setForm({
          name: t.name,
          division: t.division ?? undefined,
          recruitingRoles: t.recruitingRoles,
          requiredHours: t.requiredHours,
          isActivelyRecruiting: t.isActivelyRecruiting,
        });
      })
      .catch(() => setTeamId(null));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      if (teamId) {
        await teamApi.update(teamId, form);
      } else {
        const created = await teamApi.create(form);
        setTeamId(created.id);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-foreground">Team Settings</h1>
      <p className="mb-6 text-sm text-foreground-muted">
        Your division and required practice hours drive the "Sort by Overlap" search on the LFG board.
      </p>

      <div className="space-y-8 rounded-sm border border-border bg-card p-6">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Team Name</h3>
          <input
            value={form.name ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Radiant Rejects"
            className="w-full rounded-sm border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-muted/60 focus:border-primary"
          />
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Target Division</h3>
          <Select
            value={form.division}
            onValueChange={(v) => setForm((f) => ({ ...f, division: (v || undefined) as PremierDivision | undefined }))}
            placeholder="Select division"
            options={PREMIER_DIVISIONS.map((d) => ({ value: d, label: DIVISION_LABEL[d] }))}
          />
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            Recruiting Roles <span className="normal-case text-foreground-muted/70">(roster gaps, not playstyle tags)</span>
          </h3>
          <ToggleGroup
            type="multiple"
            value={form.recruitingRoles ?? []}
            onValueChange={(v) => setForm((f) => ({ ...f, recruitingRoles: v as ValorantRole[] }))}
            items={VALORANT_ROLES.map((r) => ({ value: r, label: r }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Actively Recruiting</h3>
          <Switch
            checked={form.isActivelyRecruiting ?? true}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isActivelyRecruiting: v }))}
          />
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Required Practice Hours</h3>
          <ScheduleGrid
            mode="hour"
            value={form.requiredHours ?? []}
            onChange={(v) => setForm((f) => ({ ...f, requiredHours: v }))}
          />
        </div>

        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : teamId ? "Save Changes" : "Create Team"}
        </Button>
      </div>
    </div>
  );
}
