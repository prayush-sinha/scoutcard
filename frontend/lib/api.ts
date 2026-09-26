import axios from "axios";
import type {
  Application,
  ApplicationHistoryEntry,
  AuthenticatedPlayer,
  LiveNotification,
  PlayerSearchFilters,
  ScoutCard,
  ScoutCardPayload,
  Team,
  TeamPayload,
  TrustScoreResult,
  VerificationStatus,
} from "./types";

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  withCredentials: true, // the backend also accepts a `token` cookie as a fallback to the Bearer header
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * Stores the JWT in both localStorage (read by the request interceptor above,
 * for the Authorization header every API call needs) and a plain — not
 * httpOnly, since only client JS can set it here — cookie, which is only
 * there for middleware.ts to check for at the edge. The middleware never
 * reads or validates the JWT itself, just whether this cookie exists.
 */
export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
  document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
}

// A 401 means the token is missing, expired, or invalid server-side — clear
// whatever we're holding client-side too so a stale cookie doesn't keep
// middleware.ts letting the user into a page that will just 401 again.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      clearAuthToken();
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

type Envelope<T> = { success: boolean; data: T; message?: string };
type Paginated<T> = { success: boolean; data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } };
const unwrap = <T,>(res: { data: Envelope<T> }) => res.data.data;
const unwrapList = <T,>(res: { data: Paginated<T> }) => res.data.data;

// ---- Auth ----
// The Discord OAuth redirect lands on /auth/success?token=...&new_user=0|1 — see
// app/auth/success/page.tsx, which calls setAuthToken() above with it.
export const authApi = {
  me: () => api.get<Envelope<AuthenticatedPlayer>>("/auth/me").then(unwrap),
  logout: async () => {
    await api.post("/auth/logout");
    clearAuthToken();
  },
  discordLoginUrl: () => `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/discord`,
};

// ---- Riot verification ----
export const verificationApi = {
  verifyRiotId: (riotId: string) =>
    api.post<Envelope<TrustScoreResult>>("/verification/verify-riot", { riotId }).then(unwrap),
  status: () => api.get<Envelope<VerificationStatus>>("/verification/status").then(unwrap),
};

// ---- Scout cards / players ----
export const playerApi = {
  getMyScoutCard: () => api.get<Envelope<ScoutCard & { completionScore: number }>>("/players/scout-card").then(unwrap),
  /** PUT — full save; pass isPublished:true to publish (enforces all required fields). */
  updateMyScoutCard: (payload: ScoutCardPayload) =>
    api.put<Envelope<ScoutCard>>("/players/scout-card", payload).then(unwrap),
  /** POST /scout-card/draft — silent partial autosave, no publish validation. Call this while editing. */
  saveDraft: (payload: Partial<ScoutCardPayload>) =>
    api.post<Envelope<{ id: string; updatedAt: string }>>("/players/scout-card/draft", payload).then(unwrap),
  search: (filters: PlayerSearchFilters = {}) => {
    const params: Record<string, string> = {};
    if (filters.division) params.division = filters.division;
    if (filters.agents?.length) params.agents = filters.agents.join(",");
    if (filters.tags?.length) params.tags = filters.tags.join(",");
    if (filters.verified) params.verified = "true";
    if (filters.teamId) params.teamId = filters.teamId;
    if (filters.sort) params.sort = filters.sort;
    if (filters.page) params.page = String(filters.page);
    if (filters.limit) params.limit = String(filters.limit);
    return api.get<Paginated<ScoutCard>>("/players/search", { params }).then(unwrapList);
  },
  getById: (id: string, teamId?: string) =>
    api.get<Envelope<ScoutCard>>(`/players/${id}`, { params: teamId ? { teamId } : undefined }).then(unwrap),
};

// ---- Teams ----
export const teamApi = {
  create: (payload: TeamPayload) => api.post<Envelope<Team>>("/teams", payload).then(unwrap),
  /** Includes `applicationStats` (per-status counts) and `roster` — only on this endpoint. */
  myTeam: () => api.get<Envelope<Team>>("/teams/my-team").then(unwrap),
  getById: (id: string) => api.get<Envelope<Team>>(`/teams/${id}`).then(unwrap),
  /** PUT /teams/:id — note it's keyed by team id, NOT a "/teams/my-team" write endpoint. */
  update: (id: string, payload: TeamPayload) => api.put<Envelope<Team>>(`/teams/${id}`, payload).then(unwrap),
  disband: (id: string) => api.delete(`/teams/${id}`),
};

// ---- Applications & Kanban ----
export const applicationApi = {
  submit: (teamId: string, message?: string) =>
    api.post<Envelope<Application>>("/applications", { teamId, message }).then(unwrap),
  myApplications: () => api.get<Paginated<Application>>("/applications/my-applications").then(unwrapList),
  forTeam: (teamId: string, opts?: { status?: string; page?: number; limit?: number }) =>
    api
      .get<Paginated<Application>>(`/applications/team/${teamId}`, {
        params: { status: opts?.status, page: opts?.page, limit: opts?.limit },
      })
      .then(unwrapList),
  withdraw: (id: string) => api.delete(`/applications/${id}`),
  updateStatus: (id: string, status: string, reason?: string) =>
    api.patch<Envelope<Application>>(`/applications/${id}/status`, { status, reason }).then(unwrap),
  history: (id: string) => api.get<Envelope<ApplicationHistoryEntry[]>>(`/applications/${id}/history`).then(unwrap),
};

// ---- Notifications ----
// NOT YET LIVE: /notifications routes are commented out server-side (Phase 3.3 still
// in progress per the project's own architecture notes) — only the Socket.io
// `notification:new` event works today. These calls will 404 until that route file
// ships; kept here so the frontend needs no changes when it does.
export const notificationApi = {
  list: () => api.get<Envelope<LiveNotification[]>>("/notifications"),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  dismiss: (id: string) => api.delete(`/notifications/${id}`),
};
