"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api";
import { ScoutCardSidebarMark } from "@/components/logo";

import type { AuthenticatedPlayer } from "@/lib/types";
import { NAV_GROUPS, isActive } from "./nav-items";

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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center border-b border-border px-4">
        <ScoutCardSidebarMark />
      </div>

      <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-5" aria-label="Main">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground-muted">{group.label}</p>
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "mb-0.5 flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-muted text-foreground" : "text-foreground-muted hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon size={17} className={active ? "text-primary" : undefined} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
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
            <p className="truncate text-sm font-semibold text-foreground">
              {me?.discordUsername ?? "Loading…"}
            </p>
            <p className="text-xs text-foreground-muted">Discord account</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-[13px] font-medium text-foreground-muted transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  );
}
