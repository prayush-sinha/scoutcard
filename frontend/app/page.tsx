import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoutCard } from "@/components/scout-card";
import { ScoutCardWordmark } from "@/components/logo";
import { authApi } from "@/lib/api";
import type { ScoutCard as ScoutCardData } from "@/lib/types";

// Example availability: weekday evenings + weekend afternoons/evenings (UTC).
const SAMPLE_HOURS = [
  ...[0, 1, 2, 3, 4].flatMap((d) => [17, 18, 19, 20, 21].map((h) => d * 24 + h)),
  ...[5, 6].flatMap((d) => [12, 13, 14, 15, 16, 17, 18, 19, 20].map((h) => d * 24 + h)),
];

const SAMPLE_CARD: ScoutCardData = {
  id: "sample",
  riotId: "Kairo#IND1",
  discordUsername: "kairo",
  discordAvatar: "",
  isVerified: true,
  trustScore: 87,
  division: "Advanced",
  mainAgents: ["Omen", "Sova"],
  flexAgent: "Fade",
  playstyleTags: ["IGL", "Support"],
  vodUrl: null,
  availableHours: SAMPLE_HOURS,
  isPublished: true,
};

const PLAYER_STEPS = [
  ["Verify your Riot ID", "We pull your rank and match history from Tracker.gg and turn it into a Trust Score."],
  ["Fill in your card", "Two main agents, a flex pick, your playstyle, a VOD, and the hours you can actually play."],
  ["Apply and track it live", "See every application move from Applied to Trialing to Accepted as captains act on it."],
];

const CAPTAIN_STEPS = [
  ["Set your practice hours", "Tell us when your team plays. Every card is scored against that schedule."],
  ["Filter by what matters", "Division, playstyle, verified-only, and a one-click sort by schedule overlap."],
  ["Run a real pipeline", "Drag applicants through Applied, Reviewed, Trialing, and Accepted on a live board."],
];

export default function LandingPage() {
  const login = authApi.discordLoginUrl();

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <ScoutCardWordmark />
        <nav className="flex items-center gap-2">
          <Link href="/players" className="hidden px-3 py-2 text-sm text-foreground-muted hover:text-foreground sm:block">
            Browse players
          </Link>
          <a href={login}>
            <Button size="sm">Sign in with Discord</Button>
          </a>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Valorant Premier recruiting</p>
            <h1 className="font-display text-6xl font-black uppercase leading-[0.92] text-foreground sm:text-7xl lg:text-8xl">
              Your Riot ID is your <span className="text-primary">resume.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground-muted">
              Verified rank, real playstyle, and the hours you can actually practice, on one card a Premier captain can
              judge in five seconds.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={login}>
                <Button>
                  Build my Scout Card <ArrowRight size={16} />
                </Button>
              </a>
              <Link href="/players">
                <Button variant="outline">Browse the LFG board</Button>
              </Link>
            </div>
          </div>

          {/* Sample card — the actual product, live on the landing page */}
          <div className="hidden lg:block">
            <ScoutCard card={SAMPLE_CARD} />
          </div>
        </section>

        {/* How it works — separate columns for players vs captains */}
        <section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl gap-0 divide-y divide-border px-5 sm:px-8 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            <HowItWorks role="Players" steps={PLAYER_STEPS} cta={{ label: "Build my Scout Card", href: login, external: true }} />
            <HowItWorks role="Captains" steps={CAPTAIN_STEPS} cta={{ label: "Browse the LFG board", href: "/players" }} />
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px bg-border sm:grid-cols-3">
            <Stat value="Tracker.gg" label="Rank verified" />
            <Stat value="168 h/wk" label="Schedule resolution" />
            <Stat value="5 stages" label="Applied → Accepted" />
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-foreground-muted">
        ScoutCard is an independent tool. Not affiliated with Riot Games.
      </footer>
    </div>
  );
}

function HowItWorks({
  role,
  steps,
  cta,
}: {
  role: string;
  steps: string[][];
  cta: { label: string; href: string; external?: boolean };
}) {
  return (
    <div className="py-12 lg:px-8 lg:first:pr-8 lg:last:pl-8">
      <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">For {role}</p>
      <ol className="space-y-5">
        {steps.map(([title, body], i) => (
          <li key={i} className="flex gap-4">
            <span className="font-display mt-0.5 shrink-0 text-2xl font-black leading-none text-primary">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground-muted">{body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-8">
        {cta.external ? (
          <a href={cta.href}>
            <Button variant="outline" size="sm">{cta.label}</Button>
          </a>
        ) : (
          <Link href={cta.href}>
            <Button variant="outline" size="sm">{cta.label}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-card px-8 py-8 text-center">
      <p className="font-display text-4xl font-black text-foreground">{value}</p>
      <p className="mt-1 text-sm text-foreground-muted">{label}</p>
    </div>
  );
}
