import { cn } from "@/lib/utils";

export function ScoutCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("clip-notch bg-border p-px", className)}>
      <div className="clip-notch flex h-full flex-col bg-card p-4">
        {/* Header Skeleton */}
        <div className="flex items-start gap-3 pb-3">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-sm bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-5 w-28 animate-pulse rounded bg-muted" />
          </div>
          <div className="shrink-0 space-y-1 text-right">
            <div className="h-8 w-12 animate-pulse rounded bg-muted" />
            <div className="h-3 w-10 animate-pulse rounded bg-muted" />
          </div>
        </div>

        {/* Agents Row Skeleton */}
        <div className="grid grid-cols-3 gap-2 py-3">
          <div className="aspect-[1/1.1] animate-pulse rounded-sm bg-muted" />
          <div className="aspect-[1/1.1] animate-pulse rounded-sm bg-muted" />
          <div className="aspect-[1/1.1] animate-pulse rounded-sm bg-muted" />
        </div>

        {/* Playstyle Tag Skeleton */}
        <div className="flex gap-2 py-2">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>

        {/* Availability Strip Skeleton */}
        <div className="space-y-1.5 py-3">
          <div className="flex justify-between">
            <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-12 w-full animate-pulse rounded-sm bg-muted/60" />
        </div>

        {/* Action Button Skeleton */}
        <div className="mt-auto flex gap-2 border-t border-border pt-3">
          <div className="h-9 flex-1 animate-pulse rounded-sm bg-muted" />
          <div className="h-9 flex-1 animate-pulse rounded-sm bg-muted" />
        </div>
      </div>
    </div>
  );
}
