import { Search, Contact, ListChecks, Users, KanbanSquare, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Player",
    items: [
      { href: "/scout-card/edit", label: "My Scout Card", short: "Card", icon: Contact },
      { href: "/my-applications", label: "My Applications", short: "Applied", icon: ListChecks },
    ],
  },
  {
    label: "Captain",
    items: [
      { href: "/players", label: "LFG Board", short: "Players", icon: Search },
      { href: "/team/applications", label: "Applications Board", short: "Board", icon: KanbanSquare },
      { href: "/team/settings", label: "Team Settings", short: "Team", icon: Users },
    ],
  },
];

export function isActive(pathname: string | null, href: string) {
  return !!pathname && (pathname === href || pathname.startsWith(href + "/"));
}
