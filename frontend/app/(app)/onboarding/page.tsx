"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Trophy,
  Clock,
  Swords,
  Activity,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { verificationApi } from "@/lib/api";
import type { TrustScoreResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const [riotId, setRiotId] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "checking" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<TrustScoreResult | null>(null);
  const [verifyingStep, setVerifyingStep] = React.useState(0);

  const steps = [
    { num: 1, label: "Riot Identity" },
    { num: 2, label: "Tracker.gg Audit" },
    { num: 3, label: "Trust Score" },
  ];

  const currentStep = result ? 3 : status === "checking" ? 2 : 1;

  const verify = async () => {
    setStatus("checking");
    setErrorMessage(null);
    setVerifyingStep(1);

    const stepTimer1 = setTimeout(() => setVerifyingStep(2), 600);
    const stepTimer2 = setTimeout(() => setVerifyingStep(3), 1200);

    try {
      const res = await verificationApi.verifyRiotId(riotId);
      setResult(res);
      setStatus("success");
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Couldn't verify that Riot ID. Ensure the name and tagline (e.g. Player#NA1) are exact and your Tracker.gg profile is public.";
      setErrorMessage(message);
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto max-w-xl py-6">
      {/* Step Indicator Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
          <ShieldCheck size={32} />
        </div>
        <h1 className="font-display text-3xl font-black uppercase tracking-wide text-foreground sm:text-4xl">
          Riot ID Verification
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-foreground-muted">
          ScoutCard calculates an anti-smurf Trust Score using Tracker.gg match history and competitive rank data.
        </p>

        {/* 3-Step Pill Bar */}
        <div className="mx-auto mt-6 flex max-w-md items-center justify-between border-t border-b border-border/80 py-3 text-xs">
          {steps.map((s) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div key={s.num} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                    isDone
                      ? "bg-success text-black"
                      : isCurrent
                      ? "bg-primary text-white ring-2 ring-primary/30"
                      : "bg-muted text-foreground-muted"
                  )}
                >
                  {isDone ? "✓" : s.num}
                </span>
                <span
                  className={cn(
                    "font-semibold uppercase tracking-wider text-[11px]",
                    isCurrent ? "text-foreground" : "text-foreground-muted"
                  )}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="rounded-sm border border-border bg-card p-6 shadow-xl sm:p-8">
        {!result ? (
          /* Step 1 & 2: Input & Verification Loading */
          <div className="space-y-6">
            <div>
              <label htmlFor="riotId" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground">
                Enter your Riot ID & Tag
              </label>
              <div className="relative">
                <input
                  id="riotId"
                  value={riotId}
                  onChange={(e) => setRiotId(e.target.value)}
                  placeholder="e.g. TenZ#0001 or Kairo#IND1"
                  disabled={status === "checking"}
                  className="w-full rounded-sm border border-border bg-muted px-4 py-3 text-sm font-medium text-foreground outline-none placeholder:text-foreground-muted/50 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <p className="mt-2 text-[11px] text-foreground-muted">
                Your Riot ID format is <span className="font-semibold text-foreground">Name#Tag</span>. Case does not matter.
              </p>
            </div>

            {/* Live Verification Status Messages */}
            {status === "checking" && (
              <div className="space-y-3 rounded-sm border border-primary/30 bg-primary/10 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Activity size={14} className="animate-spin" />
                  <span>
                    {verifyingStep === 1 && "Connecting to Tracker.gg network..."}
                    {verifyingStep === 2 && "Validating competitive match history & ranks..."}
                    {verifyingStep >= 3 && "Computing Trust Score and verifying badge..."}
                  </span>
                </div>
                <Progress value={verifyingStep * 33} />
              </div>
            )}

            {/* Error Message */}
            {status === "error" && errorMessage && (
              <div className="flex items-start gap-2.5 rounded-sm border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">Verification Failed</p>
                  <p className="leading-relaxed text-foreground-muted">{errorMessage}</p>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={verify}
              disabled={!riotId.trim() || !riotId.includes("#") || status === "checking"}
            >
              {status === "checking" ? "Auditing Profile…" : "Verify with Tracker.gg"}
            </Button>

            {/* Help Note */}
            <div className="rounded-sm border border-border/60 bg-muted/30 p-3 text-center text-[11px] text-foreground-muted">
              Make sure your Riot account privacy is set to public so Tracker.gg can read your competitive statistics.
            </div>
          </div>
        ) : (
          /* Step 3: Verified Result Dossier */
          <div className="space-y-6">
            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-success">
                  Verification Complete
                </span>
                <h2 className="text-xl font-bold text-foreground">{riotId}</h2>
              </div>
              <div className="text-right">
                <span className="font-display text-3xl font-extrabold text-success">
                  {result.trustScore}
                </span>
                <span className="block text-[10px] uppercase text-foreground-muted">Trust Score</span>
              </div>
            </div>

            {/* Tracker Stats Overview */}
            {result.trackerData && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-sm border border-border bg-muted/40 p-3 text-center">
                  <Trophy size={16} className="mx-auto mb-1 text-primary" />
                  <span className="block text-[10px] uppercase text-foreground-muted">Rank</span>
                  <span className="text-sm font-bold text-foreground">{result.trackerData.rank}</span>
                </div>
                <div className="rounded-sm border border-border bg-muted/40 p-3 text-center">
                  <Sparkles size={16} className="mx-auto mb-1 text-warning" />
                  <span className="block text-[10px] uppercase text-foreground-muted">Peak Rank</span>
                  <span className="text-sm font-bold text-foreground">{result.trackerData.peakRank}</span>
                </div>
                <div className="rounded-sm border border-border bg-muted/40 p-3 text-center">
                  <Swords size={16} className="mx-auto mb-1 text-success" />
                  <span className="block text-[10px] uppercase text-foreground-muted">Win Rate</span>
                  <span className="text-sm font-bold text-foreground">{result.trackerData.winRate}%</span>
                </div>
                <div className="rounded-sm border border-border bg-muted/40 p-3 text-center">
                  <Clock size={16} className="mx-auto mb-1 text-foreground-muted" />
                  <span className="block text-[10px] uppercase text-foreground-muted">Matches</span>
                  <span className="text-sm font-bold text-foreground">{result.trackerData.matchesPlayed}</span>
                </div>
              </div>
            )}

            {/* Trust Breakdown Pillars */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">
                Trust Score Breakdown
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted">Competitive Rank Weight</span>
                  <span className="font-bold text-foreground">{result.breakdown.rankScore} / 30</span>
                </div>
                <Progress value={(result.breakdown.rankScore / 30) * 100} />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-foreground-muted">Match History Depth</span>
                  <span className="font-bold text-foreground">{result.breakdown.matchesScore} / 30</span>
                </div>
                <Progress value={(result.breakdown.matchesScore / 30) * 100} />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-foreground-muted">Recent Account Activity</span>
                  <span className="font-bold text-foreground">{result.breakdown.activityScore} / 20</span>
                </div>
                <Progress value={(result.breakdown.activityScore / 20) * 100} />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-foreground-muted">Time Played & Tenure</span>
                  <span className="font-bold text-foreground">{result.breakdown.timePlayedScore} / 20</span>
                </div>
                <Progress value={(result.breakdown.timePlayedScore / 20) * 100} />
              </div>
            </div>

            {/* Next Steps CTA */}
            <div className="space-y-3 pt-2">
              <Button className="w-full" onClick={() => router.push("/scout-card/edit")}>
                Build Your Scout Card <ArrowRight size={15} />
              </Button>
              <button
                onClick={() => {
                  setResult(null);
                  setStatus("idle");
                  setRiotId("");
                }}
                className="block w-full text-center text-xs text-foreground-muted hover:text-foreground"
              >
                Verify a different Riot ID
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
