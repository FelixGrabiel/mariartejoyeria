"use client";

import { cn } from "@/lib/format";
import { Minus, Plus } from "@/components/ui/icons";

export function QuantitySelector({
  value,
  max,
  onChange,
  min = 1,
  size = "md",
  label = "Cantidad",
  disabled = false,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  min?: number;
  size?: "sm" | "md";
  label?: string;
  disabled?: boolean;
}) {
  const atMin = value <= min;
  const atMax = value >= max;
  const btn = size === "sm" ? "h-9 w-9" : "h-12 w-12";

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-white",
        disabled && "opacity-50",
      )}
    >
      <button
        type="button"
        className={cn(btn, "flex items-center justify-center rounded-full text-ink transition hover:bg-blush-soft disabled:opacity-35 disabled:hover:bg-transparent")}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || atMin}
        aria-label="Disminuir cantidad"
      >
        <Minus size={16} />
      </button>
      <output
        aria-live="polite"
        aria-label={`${label}: ${value}`}
        className={cn("min-w-8 text-center font-semibold tabular-nums", size === "sm" ? "text-sm" : "text-base")}
      >
        {value}
      </output>
      <button
        type="button"
        className={cn(btn, "flex items-center justify-center rounded-full text-ink transition hover:bg-blush-soft disabled:opacity-35 disabled:hover:bg-transparent")}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || atMax}
        aria-label={atMax ? `Máximo disponible: ${max}` : "Aumentar cantidad"}
        title={atMax ? `Máximo disponible: ${max}` : undefined}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
