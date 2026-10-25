"use client";

import { useId } from "react";
import { cn } from "@/lib/format";
import type { ProductVariant } from "@/types";

export function VariantSelector({
  name,
  variants,
  value,
  onChange,
}: {
  name: string;
  variants: ProductVariant[];
  value: string | undefined;
  onChange: (sku: string) => void;
}) {
  const groupId = useId();
  const selected = variants.find((v) => v.sku === value);

  return (
    <fieldset>
      <legend className="mb-3 flex items-baseline gap-2 text-[13px] font-semibold text-ink">
        {name}
        {selected && <span className="font-normal text-muted">· {selected.label}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const soldOut = variant.stock <= 0;
          const checked = variant.sku === value;
          return (
            <label
              key={variant.sku}
              className={cn(
                "relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-[14px] transition has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-rose has-[input:focus-visible]:ring-offset-2",
                checked ? "border-rose bg-blush-soft font-semibold text-rose-deep" : "border-line bg-white text-ink hover:border-rose/60",
                soldOut && "cursor-not-allowed border-dashed bg-transparent text-muted/70 hover:border-line",
              )}
            >
              <input
                type="radio"
                name={`variant-${groupId}`}
                value={variant.sku}
                checked={checked}
                disabled={soldOut}
                onChange={() => onChange(variant.sku)}
                className="sr-only"
              />
              <span className={cn(soldOut && "line-through decoration-1")}>{variant.label}</span>
              {soldOut && <span className="text-[11px] font-semibold uppercase tracking-wide no-underline">Agotado</span>}
              {checked && <span className="sr-only">(seleccionado)</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
