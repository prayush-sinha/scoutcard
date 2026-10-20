"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, isActive } from "./nav-items";

export function MobileTabBar() {
  const pathname = usePathname();
  const items = NAV_GROUPS.flatMap((g) => g.items);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium",
              active ? "text-primary" : "text-foreground-muted"
            )}
          >
            <Icon size={20} />
            {item.short}
          </Link>
        );
      })}
    </nav>
  );
}
