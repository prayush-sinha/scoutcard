import { Search, Contact, ListChecks, Users, KanbanSquare, Shield, type LucideIcon } from "lucide-react";

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
      { href: "/teams", label: "Find Teams", short: "Teams", icon: Users },
      { href: "/my-applications", label: "My Applications", short: "Applied", icon: ListChecks },
    ],
  },
  {
    label: "Captain",
    items: [
      { href: "/players", label: "LFG Board", short: "Players", icon: Search },
      { href: "/team/applications", label: "Applications Board", short: "Board", icon: KanbanSquare },
      { href: "/team/settings", label: "Team Settings", short: "Team", icon: Shield },
    ],
  },
];

export function isActive(pathname: string | null, href: string) {
  return !!pathname && (pathname === href || pathname.startsWith(href + "/"));
}
