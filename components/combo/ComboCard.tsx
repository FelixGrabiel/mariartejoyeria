"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { comboTotals, discountedPrice } from "@/lib/combo";
import { formatDate, formatPrice } from "@/lib/format";
import type { Combo } from "@/types";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { Badge } from "@/components/ui/Badge";
import { ShoppingBag, Sparkles } from "@/components/ui/icons";
import { ProductImage } from "@/components/ui/ProductImage";

/** Tarjeta de un combo: componentes con sus precios, ahorro real y selección de variantes cuando hace falta. */
export function ComboCard({ combo }: { combo: Combo }) {
  const { products, addComboToCart } = useStore();
  const { showToast } = useToast();
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [quantity, setQuantity] = useState(1);

  const parts = useMemo(
    () =>
      combo.items.map((it, i) => {
        const product = products.find((p) => p.id === it.productId);
        const options = (product?.variants ?? []).filter((v) => v.stock > 0);
        const fixed = it.sku ? product?.variants.find((v) => v.sku === it.sku) : undefined;
        const sku = it.sku ?? picks[i] ?? (options.length === 1 ? options[0].sku : undefined);
        return { it, product, options, fixed, sku, ok: Boolean(product?.active && (it.sku ? fixed && fixed.stock > 0 : options.length > 0)) };
      }),
    [combo.items, products, picks],
  );

  const available = parts.length > 0 && parts.every((p) => p.ok);
  const complete = parts.every((p) => p.sku);
  const totals = comboTotals(
    parts.filter((p) => p.product).map((p) => ({ price: p.product!.price, quantity: p.it.quantity })),
    combo.discountPercent,
  );

  function handleAdd() {
    const result = addComboToCart(
      combo.id,
      parts.map((p) => p.sku ?? ""),
      quantity,
    );
    showToast(result.message, {
      tone: result.ok ? "success" : "error",
      action: result.ok ? { label: "Ver carrito", href: "/carrito" } : undefined,
    });
  }

  return (
    <article className="flex h-full flex-col rounded-3xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="blush">
          <Sparkles size={12} className="mr-1 inline" /> Combo
        </Badge>
        {combo.discountPercent > 0 && <Badge tone="success">{combo.discountPercent}% menos</Badge>}
        {combo.endsAt && <span className="text-[12px] text-muted">Hasta el {formatDate(combo.endsAt)}</span>}
      </div>
      <h3 className="mt-3 font-serif text-[1.6rem] font-semibold leading-tight">{combo.name}</h3>
      {combo.description && <p className="mt-1 text-[14px] text-muted">{combo.description}</p>}

      <ul className="mt-4 space-y-3">
        {parts.map((p, i) =>
          p.product ? (
            <li key={`${p.it.productId}-${i}`} className="flex gap-3">
              <Link href={`/producto/${p.product.slug}`} className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-xl bg-blush-soft">
                <ProductImage src={p.product.images[0]} alt={p.product.name} sizes="64px" compact />
              </Link>
              <div className="min-w-0 flex-1 text-[14px]">
                <p className="font-semibold text-ink">
                  {p.it.quantity}× {p.product.name}
                </p>
                <p className="text-[13px] text-muted">
                  {combo.discountPercent > 0 && <s className="mr-1.5 text-muted/70">{formatPrice(p.product.price)}</s>}
                  {formatPrice(discountedPrice(p.product.price, combo.discountPercent))} c/u
                </p>
                {p.it.sku ? (
                  <p className="text-[12.5px] text-muted">{p.product.variantName ?? "Opción"}: {p.fixed?.label ?? "no disponible"}</p>
                ) : (
                  <div className="mt-1">
                    <label htmlFor={`combo-${combo.id}-${i}`} className="sr-only">
                      {p.product.variantName ?? "Opción"} de {p.product.name}
                    </label>
                    <select
                      id={`combo-${combo.id}-${i}`}
                      className="field min-h-10 py-1.5 text-[13px]"
                      value={p.sku ?? ""}
                      onChange={(e) => setPicks((cur) => ({ ...cur, [i]: e.target.value }))}
                      disabled={p.options.length === 0}
                    >
                      <option value="">{p.options.length ? `Elige ${p.product.variantName?.toLowerCase() ?? "una opción"}` : "Agotado"}</option>
                      {p.options.map((v) => (
                        <option key={v.sku} value={v.sku}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </li>
          ) : (
            <li key={`${p.it.productId}-${i}`} className="text-[13px] text-danger">Un producto de este combo ya no está disponible.</li>
          ),
        )}
      </ul>

      <div className="mt-auto pt-5">
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-semibold tabular-nums">{formatPrice(totals.total)}</p>
          {totals.savings > 0 && (
            <p className="text-[13px] font-medium text-success">
              Ahorras {formatPrice(totals.savings)} <s className="ml-1 text-muted/70">{formatPrice(totals.regular)}</s>
            </p>
          )}
        </div>
        <div className="mt-3 flex gap-3">
          <QuantitySelector value={quantity} max={combo.maxPerOrder} onChange={setQuantity} label={`Cantidad del combo ${combo.name}`} disabled={!available} />
          <button type="button" className="btn btn-primary flex-1" onClick={handleAdd} disabled={!available || !complete}>
            <ShoppingBag size={18} /> {available ? (complete ? "Agregar combo" : "Elige tus opciones") : "No disponible"}
          </button>
        </div>
        <p className="mt-2 text-[12px] text-muted">Máximo {combo.maxPerOrder} por pedido. El stock de cada pieza se valida al enviar.</p>
      </div>
    </article>
  );
}
