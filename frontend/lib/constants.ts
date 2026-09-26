import type { ApplicationStatus, PlaystyleTag, PremierDivision, ValorantRole } from "./types";

export const PREMIER_DIVISIONS: PremierDivision[] = [
  "Open",
  "Intermediate",
  "Advanced",
  "Elite",
  "Contender",
  "Invite",
  "EsportsOrg",
];

export const DIVISION_LABEL: Record<PremierDivision, string> = {
  Open: "Open",
  Intermediate: "Intermediate",
  Advanced: "Advanced",
  Elite: "Elite",
  Contender: "Contender",
  Invite: "Invite",
  EsportsOrg: "Esports Org",
};

/** Player Scout Card tags — filters /players/search's `tags` param. Max 2 per player. */
export const PLAYSTYLE_TAGS: PlaystyleTag[] = ["IGL", "Entry", "Lurk", "Support", "Anchor"];

export const PLAYSTYLE_LABEL: Record<PlaystyleTag, string> = {
  IGL: "In-Game Leader",
  Entry: "Entry Fragger",
  Lurk: "Lurker",
  Support: "Support",
  Anchor: "Anchor",
};

/** Team roster role gaps — a separate taxonomy from PlaystyleTag, used only on Team.recruitingRoles. */
export const VALORANT_ROLES: ValorantRole[] = ["Duelist", "Initiator", "Controller", "Sentinel", "Flex"];

export const VALORANT_ROLE_LABEL: Record<ValorantRole, string> = {
  Duelist: "Duelist",
  Initiator: "Initiator",
  Controller: "Controller",
  Sentinel: "Sentinel",
  Flex: "Flex",
};

// Current Valorant agent roster — matches VALORANT_AGENTS in the backend's src/types/index.ts exactly.
export const AGENTS = [
  "Astra", "Breach", "Brimstone", "Chamber", "Clove", "Cypher",
  "Deadlock", "Fade", "Gekko", "Harbor", "Iso", "Jett", "KAY/O",
  "Killjoy", "Neon", "Omen", "Phoenix", "Raze", "Reyna", "Sage",
  "Skye", "Sova", "Tejo", "Viper", "Vyse", "Waylay", "Yoru",
];

/** Columns for the Captain's Kanban board, in workflow order. */
export const KANBAN_COLUMNS: { status: ApplicationStatus; label: string }[] = [
  { status: "Applied", label: "Applied" },
  { status: "Reviewed", label: "Reviewed" },
  { status: "Trialing", label: "Trialing" },
  { status: "Accepted", label: "Accepted" },
  { status: "Rejected", label: "Rejected" },
];

/**
 * Exact transition graph enforced server-side in application.service.ts.
 * The board uses this to reject an invalid drag locally instead of round-tripping
 * to the API just to get the same 400 back.
 */
export const KANBAN_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  Applied: ["Reviewed", "Trialing", "Rejected"],
  Reviewed: ["Trialing", "Accepted", "Rejected", "Applied"],
  Trialing: ["Accepted", "Rejected", "Reviewed"],
  Accepted: [],
  Rejected: ["Applied"],
};

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return from === to || KANBAN_TRANSITIONS[from].includes(to);
}

/**
 * Coarse day-part blocks used by the recruiter Filter Sidebar's schedule
 * matrix. Each block expands to a set of hour-of-day values (0-23) that get
 * mapped onto the 168-hour week grid (see lib/schedule.ts). This is a local
 * "what do you need covered" scratchpad — it is NOT what the "Sort by
 * Overlap" toggle uses (that hits the real server-side comparison against
 * the captain's saved Team.requiredHours).
 */
export const DAY_PARTS = [
  { key: "morning", label: "Morning", hours: [6, 7, 8, 9, 10, 11] },
  { key: "afternoon", label: "Afternoon", hours: [12, 13, 14, 15, 16, 17] },
  { key: "evening", label: "Evening", hours: [18, 19, 20, 21] },
  { key: "night", label: "Night", hours: [22, 23, 0, 1, 2, 3, 4, 5] },
] as const;

export const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
