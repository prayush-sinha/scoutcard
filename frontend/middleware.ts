import { NextRequest, NextResponse } from "next/server";

/**
 * Edge-level gate for routes that are meaningless without a session:
 * editing your own Scout Card, your own applications, your own team, or
 * verifying your own Riot ID. Browsing is intentionally NOT gated here —
 * /players (LFG board), /players/[id], and /teams/[id] stay public to match
 * the landing page's own "Browse the LFG board" CTA for signed-out visitors.
 *
 * This only checks for the *presence* of a token cookie, not its validity —
 * an expired/invalid token still gets past this and fails at the API layer,
 * where the response interceptor in lib/api.ts clears it and bounces home.
 * Real auth enforcement always happens server-side on the actual backend.
 */
export function middleware(request: NextRequest) {
  const hasToken = Boolean(request.cookies.get("token")?.value);
  if (hasToken) return NextResponse.next();
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/scout-card/:path*", "/my-applications", "/team/:path*", "/onboarding"],
};
