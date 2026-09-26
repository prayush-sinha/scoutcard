import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

/** Native <select> styled to match the design system — no portal/positioning bugs, fully accessible for free. */
export function Select({ value, onValueChange, options, placeholder, className }: SelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value ?? ""}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full appearance-none rounded-sm border border-border bg-muted px-3 py-2 pr-8 text-sm text-foreground outline-none transition-colors focus:border-primary"
      >
        {placeholder && (
          <option value="" disabled={value !== undefined && value !== ""}>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
    </div>
  );
}
