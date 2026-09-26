import Link from "next/link";
import { ShieldCheck, Radar, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-8 py-5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
          <span className="text-sm font-bold uppercase tracking-widest">ScoutCard</span>
        </div>
        <a href={authApi.discordLoginUrl()}>
          <Button size="sm">Sign in with Discord</Button>
        </a>
      </header>

      <section className="mx-auto max-w-4xl px-8 py-24 text-center">
        <p className="mb-4 text-sm font-medium text-primary">Valorant Premier Recruiting</p>
        <h1 className="text-5xl font-bold leading-tight text-foreground">
          Your Riot ID is your resume.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-foreground-muted">
          Verified rank, real playstyle tags, and an actual practice schedule — everything a
          Premier captain needs to know before they invite you, in one card.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href={authApi.discordLoginUrl()}>
            <Button>Build my Scout Card</Button>
          </a>
          <Link href="/players">
            <Button variant="outline">Browse the LFG board</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-6 border-t border-border px-8 py-16 sm:grid-cols-3">
        <Feature icon={<ShieldCheck size={20} className="text-success" />} title="Verified, not vouched">
          Trust Scores come from Tracker.gg-verified rank data, not screenshots.
        </Feature>
        <Feature icon={<Radar size={20} className="text-primary" />} title="Schedule overlap, not guesswork">
          Filter players by the exact hours your team actually practices.
        </Feature>
        <Feature icon={<Swords size={20} className="text-warning" />} title="A real pipeline">
          Applied → Reviewed → Trialing → Accepted, tracked live on a captain's board.
        </Feature>
      </section>
    </div>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="mb-3">{icon}</div>
      <h3 className="mb-1.5 font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-foreground-muted">{children}</p>
    </div>
  );
}
