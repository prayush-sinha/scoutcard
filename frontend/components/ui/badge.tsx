import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "success" | "warning" | "danger" | "outline";

const variantClasses: Record<Variant, string> = {
  default: "bg-primary/15 text-primary border border-primary/30",
  secondary: "bg-muted text-foreground-muted border border-border",
  success: "bg-success/15 text-success border border-success/30",
  warning: "bg-warning/15 text-warning border border-warning/30",
  danger: "bg-danger/15 text-danger border border-danger/30",
  outline: "bg-transparent text-foreground-muted border border-border",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium leading-none",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
