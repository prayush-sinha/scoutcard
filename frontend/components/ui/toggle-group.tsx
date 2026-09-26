"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

interface ToggleGroupProps {
  type: "single" | "multiple";
  value: string[];
  onValueChange: (value: string[]) => void;
  items: ToggleItem[];
  max?: number;
  className?: string;
}

export function ToggleGroup({ type, value, onValueChange, items, max, className }: ToggleGroupProps) {
  const toggle = (v: string) => {
    const isActive = value.includes(v);
    if (type === "single") {
      onValueChange(isActive ? [] : [v]);
      return;
    }
    if (isActive) {
      onValueChange(value.filter((x) => x !== v));
    } else {
      if (max && value.length >= max) return;
      onValueChange([...value, v]);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((item) => {
        const active = value.includes(item.value);
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(item.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-muted text-foreground-muted hover:border-foreground-muted/50 hover:text-foreground"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
