"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { firstAvailableVariant } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { ProductImage } from "@/components/ui/ProductImage";
import { ArrowRight, ShoppingBag } from "@/components/ui/icons";
import { QuantitySelector } from "./QuantitySelector";
import { StockStatus } from "./StockStatus";
import { VariantSelector } from "./VariantSelector";

export function QuickViewModal({ product, open, onClose }: { product: Product; open: boolean; onClose: () => void }) {
  const { addToCart } = useStore();
  const { showToast } = useToast();
  const [sku, setSku] = useState<string | undefined>(() => firstAvailableVariant(product)?.sku);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (open) {
      setSku(firstAvailableVariant(product)?.sku);
      setQuantity(1);
    }
  }, [open, product]);

  const variant = product.variants.find((v) => v.sku === sku);
  const stock = variant?.stock ?? 0;

  function handleAdd() {
    if (!variant) return;
    const result = addToCart(product.id, variant.sku, quantity);
    showToast(result.message, {
      tone: result.ok ? "success" : "error",
      action: result.ok ? { label: "Ver carrito", href: "/carrito" } : undefined,
    });
    if (result.ok) onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={product.name} variant="sheet" size="lg" hideTitle>
      <div className="grid gap-6 sm:grid-cols-[0.9fr_1fr] sm:gap-8">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-blush-soft">
          <ProductImage src={product.images[0]} alt={product.name} sizes="(min-width: 640px) 320px, 90vw" />
        </div>
        <div className="flex flex-col">
          <p className="eyebrow">Vista rápida</p>
          <h3 className="mt-2 font-serif text-3xl font-semibold leading-tight">{product.name}</h3>
          <p className="mt-2 text-lg font-semibold">{formatPrice(product.price)}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{product.description}</p>

          <div className="mt-5 space-y-5">
            {product.variants.length > 1 && (
              <VariantSelector
                name={product.variantName ?? "Opción"}
                variants={product.variants}
                value={sku}
                onChange={(next) => {
                  setSku(next);
                  setQuantity(1);
                }}
              />
            )}
            <StockStatus stock={stock} />
            <div className="flex flex-wrap items-center gap-3">
              <QuantitySelector value={quantity} max={Math.max(1, stock)} onChange={setQuantity} disabled={stock === 0} />
              <button type="button" className="btn btn-primary flex-1" onClick={handleAdd} disabled={!variant || stock === 0}>
                <ShoppingBag size={18} /> Agregar al carrito
              </button>
            </div>
          </div>

          <Link href={`/producto/${product.slug}`} onClick={onClose} className="link-underline mt-6 inline-flex items-center gap-1 text-sm font-semibold text-rose-deep">
            Ver detalle completo <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </Modal>
  );
}
