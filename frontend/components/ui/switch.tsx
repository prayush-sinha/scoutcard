import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn("inline-flex items-center gap-2 cursor-pointer focus:outline-none", className)}
    >
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 border transition-colors duration-200 ease-in-out",
          checked ? "border-success bg-success/25" : "border-border bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-3.5 w-3.5 rounded-full transition-transform duration-200 ease-in-out",
            checked
              ? "translate-x-[16px] bg-success shadow-[0_0_6px_rgba(0,229,188,0.5)]"
              : "translate-x-0 bg-foreground-muted"
          )}
        />
      </span>
      {label && <span className="text-sm text-foreground-muted">{label}</span>}
    </button>
  );
}
