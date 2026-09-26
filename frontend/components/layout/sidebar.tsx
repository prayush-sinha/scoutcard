"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Contact, ListChecks, Users, KanbanSquare, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api";

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
  const [username, setUsername] = React.useState<string | null>(null);

  React.useEffect(() => {
    authApi
      .me()
      .then((me) => setUsername(me.discordUsername))
      .catch(() => setUsername(null));
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
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
        <span className="text-sm font-bold uppercase tracking-widest">ScoutCard</span>
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

      <div className="border-t border-border p-4">
        <p className="mb-2 truncate text-[11px] text-foreground-muted">
          {username ? <>Signed in as <span className="text-foreground">{username}</span></> : "Connected to Valorant Premier"}
        </p>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-[11px] font-medium text-foreground-muted transition-colors hover:text-danger"
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  );
}
