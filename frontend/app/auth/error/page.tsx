"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";

function ErrorInner() {
  const params = useSearchParams();
  const message = params.get("message") ?? "Something went wrong signing you in with Discord.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <AlertTriangle size={28} className="text-danger" />
      <div>
        <h1 className="text-lg font-bold">Sign-in failed</h1>
        <p className="mt-1 max-w-sm text-sm text-foreground-muted">{decodeURIComponent(message)}</p>
      </div>
      <Button onClick={() => (window.location.href = authApi.discordLoginUrl())}>Try again</Button>
      <Link href="/" className="text-xs text-foreground-muted underline">
        Back to home
      </Link>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={null}>
      <ErrorInner />
    </Suspense>
  );
}
