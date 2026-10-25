import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            tone === "warning" ? "bg-warning-soft text-warning" : "bg-blush-soft text-rose",
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[1.9rem] font-semibold tabular-nums leading-none text-ink">{value}</p>
      {hint && <p className={cn("mt-2 text-[12px]", tone === "warning" ? "text-warning" : "text-muted")}>{hint}</p>}
    </div>
  );
}
