"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DIVISION_LABEL } from "@/lib/constants";
import { playerApi } from "@/lib/api";
import { trustTier, type ScoutCard } from "@/lib/types";

const TRUST_VARIANT = { high: "success", medium: "warning", low: "danger" } as const;

export default function PublicPlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [card, setCard] = React.useState<ScoutCard | null>(null);

  React.useEffect(() => {
    playerApi.getById(id).then(setCard).catch(() => setCard(null));
  }, [id]);

  if (!card) return <p className="text-sm text-foreground-muted">Loading profile…</p>;

  return (
    <div className="max-w-2xl rounded-sm border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-bold text-foreground">{card.riotId}</h1>
          {card.isVerified && <BadgeCheck size={17} className="text-success" />}
        </div>
        <Badge>{DIVISION_LABEL[card.division]}</Badge>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Badge variant={TRUST_VARIANT[trustTier(card.trustScore)]}>{card.trustScore} Trust Score</Badge>
        {card.playstyleTags.map((t) => (
          <Badge key={t} variant="secondary">{t}</Badge>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[card.mainAgents[0], card.mainAgents[1], card.flexAgent].map((agent, i) => (
          <div key={i} className="flex aspect-square flex-col items-center justify-center rounded-sm border border-border bg-muted">
            <span className="text-[10px] uppercase text-foreground-muted">{i < 2 ? "Main" : "Flex"}</span>
            <span className="mt-1 text-xs font-semibold text-foreground">{agent ?? "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
