"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { formatPrice } from "@/lib/format";
import type { CartLine } from "@/types";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { AlertCircle, Trash } from "@/components/ui/icons";
import { ProductImage } from "@/components/ui/ProductImage";

export function CartItem({ line }: { line: CartLine }) {
  const { updateQuantity, removeFromCart } = useStore();
  const { showToast } = useToast();
  const { product, variant, item } = line;
  const href = `/producto/${product.slug}`;

  return (
    <li className="flex gap-4 py-6 sm:gap-6">
      <Link href={href} className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-2xl bg-blush-soft sm:w-32">
        <ProductImage src={product.images[0]} alt={product.name} sizes="128px" compact />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-[1.3rem] font-semibold leading-tight sm:text-[1.45rem]">
              <Link href={href} className="hover:text-rose-deep">
                {product.name}
              </Link>
            </h3>
            {product.variantName && (
              <p className="mt-1 text-[13px] text-muted">
                {product.variantName}: <span className="font-medium text-ink">{variant.label}</span>
              </p>
            )}
            <p className="mt-0.5 text-[13px] text-muted">{formatPrice(line.unitPrice)} c/u</p>
          </div>
          <button
            type="button"
            onClick={() => {
              removeFromCart(product.id, variant.sku);
              showToast(`${product.name} se quitó del carrito.`, { tone: "info" });
            }}
            className="icon-btn -mr-2 -mt-2 text-muted hover:text-danger"
            aria-label={`Eliminar ${product.name} (${variant.label}) del carrito`}
          >
            <Trash size={18} />
          </button>
        </div>

        {line.issue && (
          <p role="alert" className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-danger">
            <AlertCircle size={15} /> {line.issue}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
          <QuantitySelector
            size="sm"
            value={item.quantity}
            max={Math.max(1, variant.stock)}
            onChange={(q) => updateQuantity(product.id, variant.sku, q)}
            label={`Cantidad de ${product.name}`}
            disabled={!product.active || variant.stock === 0}
          />
          <p className="text-[15px] font-semibold tabular-nums">{formatPrice(line.lineTotal)}</p>
        </div>
      </div>
    </li>
  );
}
