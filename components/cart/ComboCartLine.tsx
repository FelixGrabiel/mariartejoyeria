"use client";

import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { formatPrice } from "@/lib/format";
import type { ComboLine } from "@/types";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { AlertCircle, Sparkles, Trash } from "@/components/ui/icons";

/** Línea del carrito para un combo: muestra cada componente, el ahorro y la cantidad de combos. */
export function ComboCartLine({ line, index }: { line: ComboLine; index: number }) {
  const { updateComboQuantity, removeCombo } = useStore();
  const { showToast } = useToast();
  const { combo, item } = line;

  return (
    <li className="py-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-rose">
            <Sparkles size={14} /> Combo
            {combo.discountPercent > 0 && <span className="rounded-full bg-blush-soft px-2 py-0.5 text-[11px] normal-case tracking-normal text-rose-deep">{combo.discountPercent}% menos</span>}
          </p>
          <h3 className="font-serif text-[1.3rem] font-semibold leading-tight sm:text-[1.45rem]">{combo.name}</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            removeCombo(index);
            showToast(`${combo.name} se quitó del carrito.`, { tone: "info" });
          }}
          className="icon-btn -mr-2 -mt-2 text-muted hover:text-danger"
          aria-label={`Eliminar el combo ${combo.name} del carrito`}
        >
          <Trash size={18} />
        </button>
      </div>

      <ul className="mt-3 space-y-1 text-[13.5px] text-muted">
        {line.components.map((c, i) => (
          <li key={`${c.variant.sku}-${i}`} className="flex justify-between gap-3">
            <span className="min-w-0">
              {c.quantity}× {c.product.name} · {c.variant.label}
            </span>
            <span className="shrink-0 tabular-nums">
              {c.unitPrice < c.product.price && <s className="mr-1.5 text-muted/70">{formatPrice(c.product.price)}</s>}
              {formatPrice(c.unitPrice)}
            </span>
          </li>
        ))}
      </ul>

      {line.issue && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-danger">
          <AlertCircle size={15} /> {line.issue}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <QuantitySelector
          size="sm"
          value={item.quantity}
          max={Math.max(1, combo.maxPerOrder)}
          onChange={(q) => updateComboQuantity(index, q)}
          label={`Cantidad del combo ${combo.name}`}
        />
        <div className="text-right">
          {line.savings > 0 && <p className="text-[12px] font-medium text-success">Ahorras {formatPrice(line.savings)}</p>}
          <p className="text-[15px] font-semibold tabular-nums">{formatPrice(line.total)}</p>
        </div>
      </div>
    </li>
  );
}
