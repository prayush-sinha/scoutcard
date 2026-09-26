"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verificationApi } from "@/lib/api";
import type { TrustScoreResult } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [riotId, setRiotId] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "checking" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<TrustScoreResult | null>(null);

  const verify = async () => {
    setStatus("checking");
    setErrorMessage(null);
    try {
      const res = await verificationApi.verifyRiotId(riotId);
      setResult(res);
      setStatus("idle");
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Couldn't verify that Riot ID. Double-check the tag.";
      setErrorMessage(message);
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 text-center">
        <ShieldCheck size={32} className="mx-auto mb-3 text-success" />
        <h1 className="text-xl font-bold text-foreground">Verify your Riot ID</h1>
        <p className="text-sm text-foreground-muted">We'll pull your rank from Tracker.gg and calculate your Trust Score.</p>
      </div>

      <div className="space-y-3 rounded-sm border border-border bg-card p-6">
        <input
          value={riotId}
          onChange={(e) => setRiotId(e.target.value)}
          placeholder="Player#TAG"
          className="w-full rounded-sm border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-muted/60 focus:border-primary"
        />
        <Button className="w-full" onClick={verify} disabled={!riotId || status === "checking"}>
          {status === "checking" ? "Verifying…" : "Verify"}
        </Button>

        {status === "error" && errorMessage && <p className="text-xs text-danger">{errorMessage}</p>}

        {result && (
          <div
            className={
              result.verified
                ? "space-y-2 rounded-sm border border-success/30 bg-success/10 p-3 text-sm text-foreground"
                : "space-y-2 rounded-sm border border-warning/30 bg-warning/10 p-3 text-sm text-foreground"
            }
          >
            <p>
              {result.badge} — Trust Score {result.trustScore}/100
            </p>
            {result.trackerData && (
              <p className="text-xs text-foreground-muted">
                {result.trackerData.rank} · {result.trackerData.matchesPlayed} matches · {result.trackerData.hoursPlayed}h played
              </p>
            )}
            {!result.verified && result.reason && <p className="text-xs text-foreground-muted">{result.reason}</p>}
            {result.verified && (
              <button className="text-xs underline" onClick={() => router.push("/scout-card/edit")}>
                Build your Scout Card →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
