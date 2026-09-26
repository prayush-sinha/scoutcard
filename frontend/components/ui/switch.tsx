import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className="flex items-center gap-2 text-sm text-foreground-muted"
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-full border transition-colors",
          checked ? "border-success bg-success/30" : "border-border bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-3.5 w-3.5 rounded-full bg-foreground transition-transform",
            checked ? "translate-x-4.5 bg-success" : "translate-x-0.5"
          )}
        />
      </span>
      {label && <span>{label}</span>}
    </button>
  );
}
