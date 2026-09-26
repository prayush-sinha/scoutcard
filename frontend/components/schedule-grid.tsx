"use client";

import * as React from "react";
import { DAYS_OF_WEEK, DAY_PARTS } from "@/lib/constants";
import { blockIndices, hourIndex, isBlockActive } from "@/lib/schedule";
import { cn } from "@/lib/utils";

interface ScheduleGridProps {
  value: number[];
  onChange: (value: number[]) => void;
  /** "hour": full 7x24 grid for the Scout Card editor (matches availableHours 1:1).
   *  "block": coarse 7x4 Morning/Afternoon/Evening/Night grid for the recruiter filter sidebar. */
  mode: "hour" | "block";
  className?: string;
}

/**
 * The 168-hour weekly availability grid. Click-and-drag paints a run of
 * cells in one gesture — mirrors how you'd block out practice hours on a
 * real calendar. In "block" mode each cell represents a whole day-part
 * and toggles its full underlying hour set at once.
 */
export function ScheduleGrid({ value, onChange, mode, className }: ScheduleGridProps) {
  const selected = React.useMemo(() => new Set(value), [value]);
  const dragStateRef = React.useRef<{ painting: boolean; turningOn: boolean } | null>(null);

  const commit = (next: Set<number>) => onChange(Array.from(next).sort((a, b) => a - b));

  const setHourCell = (day: number, hour: number, on: boolean) => {
    const next = new Set(selected);
    const idx = hourIndex(day, hour);
    on ? next.add(idx) : next.delete(idx);
    commit(next);
  };

  const setBlockCell = (day: number, partKey: (typeof DAY_PARTS)[number]["key"], on: boolean) => {
    const next = new Set(selected);
    for (const idx of blockIndices(day, partKey)) {
      on ? next.add(idx) : next.delete(idx);
    }
    commit(next);
  };

  const startHourDrag = (day: number, hour: number) => {
    const turningOn = !selected.has(hourIndex(day, hour));
    dragStateRef.current = { painting: true, turningOn };
    setHourCell(day, hour, turningOn);
  };

  const dragOverHour = (day: number, hour: number) => {
    if (!dragStateRef.current?.painting) return;
    setHourCell(day, hour, dragStateRef.current.turningOn);
  };

  React.useEffect(() => {
    const stop = () => {
      dragStateRef.current = null;
    };
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, []);

  return (
    <div className={cn("select-none", className)}>
      <div
        className="grid gap-px bg-border text-[10px]"
        style={{ gridTemplateColumns: `56px repeat(7, minmax(0, 1fr))` }}
      >
        <div className="bg-background" />
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="bg-background py-1 text-center font-semibold uppercase tracking-wide text-foreground-muted">
            {d}
          </div>
        ))}

        {mode === "hour"
          ? Array.from({ length: 24 }, (_, i) => i).map((hour) => (
              <React.Fragment key={hour}>
                <div className="flex items-center justify-end bg-background pr-2 text-foreground-muted">
                  {String(hour).padStart(2, "0")}:00
                </div>
                {Array.from({ length: 7 }, (_, day) => {
                  const active = selected.has(hourIndex(day, hour));
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={active}
                      onMouseDown={() => startHourDrag(day, hour)}
                      onMouseEnter={() => dragOverHour(day, hour)}
                      className={cn(
                        "h-3.5 bg-muted transition-colors",
                        active && "bg-primary shadow-[0_0_6px_theme(colors.primary)]"
                      )}
                    />
                  );
                })}
              </React.Fragment>
            ))
          : DAY_PARTS.map((part) => (
              <React.Fragment key={part.key}>
                <div className="flex items-center justify-end bg-background pr-2 text-foreground-muted">{part.label}</div>
                {Array.from({ length: 7 }, (_, day) => {
                  const active = isBlockActive(selected, day, part.key);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setBlockCell(day, part.key, !active)}
                      className={cn(
                        "h-8 bg-muted transition-colors",
                        active && "bg-primary shadow-[0_0_8px_theme(colors.primary)]"
                      )}
                    />
                  );
                })}
              </React.Fragment>
            ))}
      </div>
    </div>
  );
}
