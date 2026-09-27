"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Contact, ListChecks, Users, KanbanSquare, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api";
import { ScoutCardSidebarMark } from "@/components/logo";

import type { AuthenticatedPlayer } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/players", label: "LFG Board", icon: Search },
  { href: "/scout-card/edit", label: "Scout Card", icon: Contact },
  { href: "/my-applications", label: "My Applications", icon: ListChecks },
  { href: "/team/settings", label: "Team", icon: Users },
  { href: "/team/applications", label: "Applications Board", icon: KanbanSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const [me, setMe] = React.useState<AuthenticatedPlayer | null>(null);

  React.useEffect(() => {
    authApi
      .me()
      .then((data) => setMe(data))
      .catch(() => setMe(null));
  }, []);

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-4">
        <ScoutCardSidebarMark />
      </div>

      <nav className="flex-1 overflow-y-auto scroll-thin px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mb-1 flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-transparent text-foreground-muted hover:border-border hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon size={16} className={active ? "text-primary" : undefined} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── User identity panel ── */}
      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center gap-3 overflow-hidden rounded-sm bg-muted/50 px-2.5 py-2">
          {/* Avatar */}
          {me?.discordAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={me.discordAvatar}
              alt={me.discordUsername ?? "Discord avatar"}
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-primary/30"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold uppercase text-primary ring-2 ring-primary/30">
              {me?.discordUsername?.[0] ?? "?"}
            </span>
          )}
          {/* Name */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-foreground">
              {me?.discordUsername ?? "Loading…"}
            </p>
            <p className="text-[10px] text-foreground-muted">Discord account</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-[11px] font-medium text-foreground-muted transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  );
}
