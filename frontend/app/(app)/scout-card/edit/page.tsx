"use client";

import * as React from "react";
import { Youtube, CheckCircle2 } from "lucide-react";
import { Select } from "@/components/ui/select";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScheduleGrid } from "@/components/schedule-grid";
import { PREMIER_DIVISIONS, DIVISION_LABEL, PLAYSTYLE_TAGS, AGENTS } from "@/lib/constants";
import { playerApi } from "@/lib/api";
import type { PlaystyleTag, PremierDivision, ScoutCardPayload } from "@/lib/types";

const EMPTY: ScoutCardPayload = {
  division: "Open",
  mainAgents: [],
  flexAgent: null,
  playstyleTags: [],
  vodUrl: null,
  availableHours: [],
  isPublished: false,
};

export default function ScoutCardEditPage() {
  const [form, setForm] = React.useState<ScoutCardPayload>(EMPTY);
  const [riotId, setRiotId] = React.useState<string | null>(null);
  const [isVerified, setIsVerified] = React.useState(false);
  const [published, setPublished] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const dirtyRef = React.useRef(false);

  React.useEffect(() => {
    playerApi
      .getMyScoutCard()
      .then((card) => {
        setForm({
          division: card.division,
          mainAgents: card.mainAgents,
          flexAgent: card.flexAgent,
          playstyleTags: card.playstyleTags,
          vodUrl: card.vodUrl,
          availableHours: card.availableHours,
        });
        setRiotId(card.riotId);
        setIsVerified(card.isVerified);
        setPublished(card.isPublished);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Every field change marks the draft dirty; a 30s interval flushes it via the
  // dedicated silent draft endpoint (POST /scout-card/draft — no publish validation),
  // matching the "30-second autosave" the backend's route comment specifies.
  React.useEffect(() => {
    if (!loaded) return;
    dirtyRef.current = true;
  }, [form.division, form.mainAgents, form.flexAgent, form.playstyleTags, form.vodUrl, form.availableHours, loaded]);

  React.useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(() => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      setSaving(true);
      playerApi.saveDraft(form).finally(() => setSaving(false));
    }, 30_000);
    return () => clearInterval(interval);
  }, [form, loaded]);

  const publish = async () => {
    setSaving(true);
    try {
      const updated = await playerApi.updateMyScoutCard({ ...form, isPublished: true });
      setPublished(updated.isPublished);
      dirtyRef.current = false;
    } finally {
      setSaving(false);
    }
  };

  // Mirrors calculateCompletionScore() server-side exactly (see player.service.ts) so the
  // bar the player sees while editing matches what GET /scout-card would report.
  const completion = React.useMemo(() => {
    let score = 0;
    if (riotId) score += 15;
    if (isVerified) score += 10;
    if (form.division) score += 15;
    if (form.mainAgents?.length === 2) score += 20;
    if (form.flexAgent) score += 10;
    if (form.playstyleTags?.length) score += 10;
    if (form.vodUrl) score += 10;
    if (form.availableHours?.length) score += 10;
    return Math.min(100, score);
  }, [riotId, isVerified, form]);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Scout Card Editor</h1>
          <p className="text-sm text-foreground-muted">
            {saving ? "Saving draft…" : published ? "Published" : "Draft — not visible on the LFG board yet"}
          </p>
        </div>
        <Button onClick={publish} disabled={completion < 100}>
          <CheckCircle2 size={15} /> Publish
        </Button>
      </div>

      <div className="mb-6">
        <div className="mb-1.5 flex justify-between text-xs text-foreground-muted">
          <span>Completion</span>
          <span>{completion}%</span>
        </div>
        <Progress value={completion} />
      </div>

      <div className="space-y-8 rounded-sm border border-border bg-card p-6">
        <Field label="Division">
          <Select
            value={form.division}
            onValueChange={(v) => setForm((f) => ({ ...f, division: v as PremierDivision }))}
            options={PREMIER_DIVISIONS.map((d) => ({ value: d, label: DIVISION_LABEL[d] }))}
          />
        </Field>

        <Field label="Main Agents (exactly 2 to publish)">
          <ToggleGroup
            type="multiple"
            max={2}
            value={form.mainAgents ?? []}
            onValueChange={(v) => setForm((f) => ({ ...f, mainAgents: v }))}
            items={AGENTS.map((a) => ({ value: a, label: a }))}
          />
        </Field>

        <Field label="Flex Agent (1, can't repeat a main agent)">
          <ToggleGroup
            type="single"
            value={form.flexAgent ? [form.flexAgent] : []}
            onValueChange={(v) => setForm((f) => ({ ...f, flexAgent: v[0] ?? null }))}
            items={AGENTS.filter((a) => !form.mainAgents?.includes(a)).map((a) => ({ value: a, label: a }))}
          />
        </Field>

        <Field label="Playstyle Tags (1-2 to publish)">
          <ToggleGroup
            type="multiple"
            max={2}
            value={form.playstyleTags ?? []}
            onValueChange={(v) => setForm((f) => ({ ...f, playstyleTags: v as PlaystyleTag[] }))}
            items={PLAYSTYLE_TAGS.map((t) => ({ value: t, label: t }))}
          />
        </Field>

        <Field label="VOD Link (YouTube watch/short, or a Medal.tv clip)">
          <div className="flex items-center gap-2 rounded-sm border border-border bg-muted px-3 py-2">
            <Youtube size={15} className="text-foreground-muted" />
            <input
              value={form.vodUrl ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, vodUrl: e.target.value || null }))}
              placeholder="https://youtube.com/watch?v=... or medal.tv/clips/..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted/60"
            />
          </div>
        </Field>

        <Field label="Weekly Availability">
          <ScheduleGrid
            mode="hour"
            value={form.availableHours ?? []}
            onChange={(v) => setForm((f) => ({ ...f, availableHours: v }))}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">{label}</h3>
      {children}
    </div>
  );
}
