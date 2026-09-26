"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setAuthToken } from "@/lib/api";

// Landing spot for the Discord OAuth redirect — the backend sends the browser here
// as `/auth/success?token=...&new_user=0|1` (see auth.controller.ts's handleDiscordCallback).
// Nothing else in the app establishes a session; this is the one place setAuthToken() gets called.
function SuccessInner() {
  const router = useRouter();
  const params = useSearchParams();

  React.useEffect(() => {
    const token = params.get("token");
    const isNewUser = params.get("new_user") === "1";

    if (!token) {
      router.replace("/auth/error?message=Missing authentication token");
      return;
    }

    setAuthToken(token);
    router.replace(isNewUser ? "/onboarding" : "/players");
  }, [params, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-foreground">
      <Loader2 size={24} className="animate-spin text-primary" />
      <p className="text-sm text-foreground-muted">Signing you in…</p>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
