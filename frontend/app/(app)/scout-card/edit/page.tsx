"use client";

import * as React from "react";
import { Youtube, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Select } from "@/components/ui/select";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScheduleGrid } from "@/components/schedule-grid";
import { ScoutCard } from "@/components/scout-card";
import { PREMIER_DIVISIONS, DIVISION_LABEL, PLAYSTYLE_TAGS, AGENTS, AGENT_ICON } from "@/lib/constants";
import { playerApi } from "@/lib/api";
import type { PlaystyleTag, PremierDivision, ScoutCardPayload, ScoutCard as ScoutCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const [discordUsername, setDiscordUsername] = React.useState<string | null>(null);
  const [discordAvatar, setDiscordAvatar] = React.useState<string | null>(null);
  const [trustScore, setTrustScore] = React.useState<number | null>(null);
  const [isVerified, setIsVerified] = React.useState(false);
  const [published, setPublished] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = React.useState(false);
  const dirtyRef = React.useRef(false);

  React.useEffect(() => {
    playerApi
      .getMyScoutCard()
      .then((card) => {
        setForm({
          division: card.division,
          mainAgents: card.mainAgents ?? [],
          flexAgent: card.flexAgent ?? null,
          playstyleTags: card.playstyleTags ?? [],
          vodUrl: card.vodUrl ?? null,
          availableHours: card.availableHours ?? [],
        });
        setRiotId(card.riotId);
        setDiscordUsername(card.discordUsername);
        setDiscordAvatar(card.discordAvatar);
        setTrustScore(card.trustScore);
        setIsVerified(card.isVerified);
        setPublished(card.isPublished);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Every field change marks the draft dirty; a 30s interval flushes it via the
  // dedicated silent draft endpoint (POST /scout-card/draft — no publish validation)
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

  // Mirrors calculateCompletionScore() server-side (1-4 main agents now supported)
  const completion = React.useMemo(() => {
    let score = 0;
    if (riotId) score += 15;
    if (isVerified) score += 10;
    if (form.division) score += 15;
    if (form.mainAgents && form.mainAgents.length >= 1 && form.mainAgents.length <= 4) score += 20;
    if (form.flexAgent) score += 10;
    if (form.playstyleTags && form.playstyleTags.length > 0) score += 10;
    if (form.vodUrl) score += 10;
    if (form.availableHours && form.availableHours.length > 0) score += 10;
    return Math.min(100, score);
  }, [riotId, isVerified, form]);

  const previewCard: ScoutCardData = {
    id: "preview-card",
    riotId: riotId ?? "Player#TAG",
    discordUsername: discordUsername ?? "player",
    discordAvatar: discordAvatar ?? "",
    isVerified,
    trustScore: trustScore ?? 50,
    division: form.division ?? "Open",
    mainAgents: form.mainAgents ?? [],
    flexAgent: form.flexAgent ?? null,
    playstyleTags: form.playstyleTags ?? [],
    vodUrl: form.vodUrl ?? null,
    availableHours: form.availableHours ?? [],
    isPublished: published,
  };

  const checklistItems = [
    { label: "Riot ID Linked", done: !!riotId },
    { label: "Tracker.gg Verified", done: isVerified },
    { label: "Premier Division", done: !!form.division },
    {
      label: `Main Agents (1-4): ${form.mainAgents?.length ?? 0}/4`,
      done: (form.mainAgents?.length ?? 0) >= 1 && (form.mainAgents?.length ?? 0) <= 4,
    },
    { label: `Flex / Fill Agent: ${form.flexAgent ?? "None"}`, done: !!form.flexAgent },
    { label: "Playstyle Tags (1-2)", done: (form.playstyleTags?.length ?? 0) > 0 },
    { label: "VOD Clip Link", done: !!form.vodUrl },
    { label: "Weekly Schedule", done: (form.availableHours?.length ?? 0) > 0 },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* Top Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-wide text-foreground sm:text-3xl">
            Scout Card Editor
          </h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            {saving ? "Saving draft…" : published ? "Published · Live on LFG board" : "Draft · Not visible on LFG board yet"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobilePreviewOpen(!mobilePreviewOpen)}
          >
            {mobilePreviewOpen ? <EyeOff size={14} /> : <Eye size={14} />}
            {mobilePreviewOpen ? "Hide Preview" : "Live Preview"}
          </Button>

          <Button onClick={publish} disabled={completion < 100}>
            <CheckCircle2 size={15} /> Publish Card
          </Button>
        </div>
      </div>

      {/* Progress Bar & Completion Notice */}
      <div className="mb-8 rounded-sm border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-foreground">Card Completion</span>
          <span className="font-display text-base font-bold text-primary">{completion}%</span>
        </div>
        <Progress value={completion} />
        {completion < 100 && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-warning">
            <AlertCircle size={13} className="shrink-0" />
            Complete all fields (including VOD link and at least 1 main agent) to publish to the LFG board.
          </p>
        )}
      </div>

      {/* Mobile Live Preview (collapsible) */}
      {mobilePreviewOpen && (
        <div className="mb-8 lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Live Card Preview</span>
          </div>
          <ScoutCard card={previewCard} />
        </div>
      )}

      {/* Two Column Layout: Editor Form + Sticky Live Preview */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* Form Fields */}
        <div className="space-y-8 rounded-sm border border-border bg-card p-6">
          <Field label="Premier Division">
            <Select
              value={form.division}
              onValueChange={(v) => setForm((f) => ({ ...f, division: v as PremierDivision }))}
              options={PREMIER_DIVISIONS.map((d) => ({ value: d, label: DIVISION_LABEL[d] }))}
            />
          </Field>

          {/* Main Agents (1-4) with Icons */}
          <Field
            label={`Main Agents (1-4 preferred agents — ${(form.mainAgents ?? []).length}/4 selected)`}
            description="Your comfort picks and comfort roles that captains will see prominently on your Scout Card."
          >
            <div className="flex flex-wrap gap-2">
              {AGENTS.map((agent) => {
                const isSelected = form.mainAgents?.includes(agent);
                const isFlex = form.flexAgent === agent;
                const icon = AGENT_ICON[agent];

                return (
                  <button
                    key={agent}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setForm((f) => ({
                          ...f,
                          mainAgents: (f.mainAgents ?? []).filter((a) => a !== agent),
                        }));
                      } else {
                        if ((form.mainAgents ?? []).length >= 4) return;
                        setForm((f) => ({
                          ...f,
                          mainAgents: [...(f.mainAgents ?? []), agent],
                          // If this agent was flex, clear flex
                          flexAgent: f.flexAgent === agent ? null : f.flexAgent,
                        }));
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-sm border px-2.5 py-1.5 text-xs font-semibold transition-all",
                      isSelected
                        ? "border-primary bg-primary/20 text-foreground ring-1 ring-primary"
                        : isFlex
                        ? "border-dashed border-border/80 bg-muted/30 opacity-40 text-foreground-muted"
                        : "border-border bg-muted/60 text-foreground-muted hover:border-foreground-muted/40 hover:text-foreground"
                    )}
                  >
                    {icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={icon}
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full object-cover ring-1 ring-border"
                      />
                    )}
                    <span>{agent}</span>
                    {isSelected && (
                      <span className="rounded-full bg-primary px-1.5 py-0.2 text-[9px] font-bold text-white">
                        #{(form.mainAgents ?? []).indexOf(agent) + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Flex / Fill Agent with Icons */}
          <Field
            label={`Flex / Fill Agent (${form.flexAgent ? `Selected: ${form.flexAgent}` : "Pick 1 agent you can fill on"})`}
            description="An agent outside your mains that you can flex to if team composition or map requires it."
          >
            <div className="flex flex-wrap gap-2">
              {AGENTS.filter((a) => !form.mainAgents?.includes(a)).map((agent) => {
                const isSelected = form.flexAgent === agent;
                const icon = AGENT_ICON[agent];

                return (
                  <button
                    key={agent}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        flexAgent: f.flexAgent === agent ? null : agent,
                      }));
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-sm border px-2.5 py-1.5 text-xs font-semibold transition-all",
                      isSelected
                        ? "border-warning bg-warning/20 text-warning ring-1 ring-warning"
                        : "border-border bg-muted/60 text-foreground-muted hover:border-foreground-muted/40 hover:text-foreground"
                    )}
                  >
                    {icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={icon}
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full object-cover ring-1 ring-border"
                      />
                    )}
                    <span>{agent}</span>
                    {isSelected && (
                      <span className="rounded-full bg-warning/80 px-1.5 py-0.2 text-[9px] font-bold text-black">
                        Flex
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Playstyle Tags */}
          <Field label="Playstyle Tags (1-2 to publish)">
            <ToggleGroup
              type="multiple"
              max={2}
              value={form.playstyleTags ?? []}
              onValueChange={(v) => setForm((f) => ({ ...f, playstyleTags: v as PlaystyleTag[] }))}
              items={PLAYSTYLE_TAGS.map((t) => ({ value: t, label: t }))}
            />
          </Field>

          {/* VOD Link */}
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

          {/* Weekly Availability */}
          <Field label="Weekly Availability (UTC)">
            <ScheduleGrid
              mode="hour"
              value={form.availableHours ?? []}
              onChange={(v) => setForm((f) => ({ ...f, availableHours: v }))}
            />
          </Field>
        </div>

        {/* Right Column: Sticky Live Preview + Checklist */}
        <div className="hidden lg:block">
          <div className="sticky top-8 space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Live Card Preview</span>
                <span className="text-[11px] text-foreground-muted">Updates as you edit</span>
              </div>
              <ScoutCard card={previewCard} />
            </div>

            {/* Checklist */}
            <div className="rounded-sm border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">
                Verification & Completion Checklist
              </h3>
              <ul className="space-y-2 text-xs">
                {checklistItems.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <span className={item.done ? "text-foreground" : "text-foreground-muted"}>
                      {item.label}
                    </span>
                    {item.done ? (
                      <span className="font-semibold text-success">✓ Done</span>
                    ) : (
                      <span className="text-foreground-muted/60">Missing</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">{label}</h3>
      {description && <p className="mb-2.5 text-xs text-foreground-muted">{description}</p>}
      {children}
    </div>
  );
}
