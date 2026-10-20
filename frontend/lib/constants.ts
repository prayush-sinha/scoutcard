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

/**
 * Portrait icon URLs from media.valorant-api.com — UUID-keyed CDN.
 * Sized at 128×128 displayicon.png (square, transparent background).
 * Update the UUID if Riot changes an agent's internal ID.
 */
export const AGENT_ICON: Record<string, string> = {
  Astra:     "https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/displayicon.png",
  Breach:    "https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png",
  Brimstone: "https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/displayicon.png",
  Chamber:   "https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png",
  Clove:     "https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/displayicon.png",
  Cypher:    "https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png",
  Deadlock:  "https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/displayicon.png",
  Fade:      "https://media.valorant-api.com/agents/dade69b4-4fb5-a78b-2eb4-7e81119baadc/displayicon.png",
  Gekko:     "https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png",
  Harbor:    "https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/displayicon.png",
  Iso:       "https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/displayicon.png",
  Jett:      "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-85d6bb0486ee/displayicon.png",
  "KAY/O":   "https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/displayicon.png",
  Killjoy:   "https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png",
  Neon:      "https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/displayicon.png",
  Omen:      "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png",
  Phoenix:   "https://media.valorant-api.com/agents/eb93336a-449b-9c1e-0ac7-dfe9992400c1/displayicon.png",
  Raze:      "https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png",
  Reyna:     "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png",
  Sage:      "https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png",
  Skye:      "https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png",
  Sova:      "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png",
  Tejo:      "https://media.valorant-api.com/agents/b444168c-4b85-52b5-bc4b-b5a7e55ab4cc/displayicon.png",
  Viper:     "https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png",
  Vyse:      "https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/displayicon.png",
  Waylay:    "https://media.valorant-api.com/agents/df1cb487-4902-d8c0-be4f-0d64d89838cd/displayicon.png",
  Yoru:      "https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5ecc/displayicon.png",
};

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
