import { cn } from "@/lib/utils";

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * Read-only 7×24 heat strip of a player's weekly availability.
 * Indices follow the API contract: 0-167, 0 = Monday 00:00 UTC (day * 24 + hour).
 * `highlight` marks hours a captain's team needs covered, so overlap is visible at a glance.
 */
export function AvailabilityStrip({
  hours,
  highlight,
  className,
}: {
  hours: number[];
  highlight?: number[];
  className?: string;
}) {
  const available = new Set(hours);
  const needed = new Set(highlight ?? []);

  return (
    <div
      className={cn("space-y-[3px]", className)}
      role="img"
      aria-label={`Available ${hours.length} hours per week, in UTC`}
    >
      {DAY_LETTERS.map((letter, day) => (
        <div key={day} className="flex items-center gap-2">
          <span className="w-3 text-xs leading-none text-foreground-muted">{letter}</span>
          <div className="grid flex-1 gap-[2px]" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
            {Array.from({ length: 24 }, (_, hour) => {
              const idx = day * 24 + hour;
              const on = available.has(idx);
              const match = on && needed.has(idx);
              return (
                <span
                  key={hour}
                  className={cn(
                    "h-2 rounded-[1px]",
                    match ? "bg-success" : on ? "bg-primary" : "bg-muted"
                  )}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
