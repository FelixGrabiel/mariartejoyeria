"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { getCategory } from "@/data/categories";
import { firstAvailableVariant, isSoldOut } from "@/lib/catalog";
import { cn, formatPrice } from "@/lib/format";
import type { Product } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Heart, Plus, Eye } from "@/components/ui/icons";
import { ProductImage } from "@/components/ui/ProductImage";
import { QuickViewModal } from "./QuickViewModal";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { addToCart, isFavorite, toggleFavorite } = useStore();
  const { showToast } = useToast();
  const [quickOpen, setQuickOpen] = useState(false);

  const soldOut = isSoldOut(product);
  const favorite = isFavorite(product.id);
  const category = getCategory(product.categoryId);
  const href = `/producto/${product.slug}`;
  const hasOptions = product.variants.length > 1;

  function handleAdd() {
    if (hasOptions) {
      setQuickOpen(true);
      return;
    }
    const variant = firstAvailableVariant(product);
    if (!variant) return;
    const result = addToCart(product.id, variant.sku, 1);
    showToast(result.message, {
      tone: result.ok ? "success" : "error",
      action: result.ok ? { label: "Ver carrito", href: "/carrito" } : undefined,
    });
  }

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] bg-blush-soft">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
          <ProductImage
            src={product.images[0]}
            alt=""
            priority={priority}
            sizes="(min-width: 1280px) 290px, (min-width: 768px) 33vw, 50vw"
            className={cn("transition duration-700 ease-out group-hover:scale-[1.04]", soldOut && "opacity-70 grayscale-[30%]")}
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          {soldOut && <Badge tone="ink">Agotado</Badge>}
          {!soldOut && product.isNew && <Badge tone="neutral">Nuevo</Badge>}
        </div>

        <button
          type="button"
          onClick={() => toggleFavorite(product.id)}
          aria-pressed={favorite}
          aria-label={favorite ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name} en favoritos`}
          className={cn(
            "absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105",
            favorite ? "text-rose" : "text-ink",
          )}
        >
          <Heart size={18} fill={favorite ? "currentColor" : "none"} />
        </button>

        <button
          type="button"
          onClick={() => setQuickOpen(true)}
          className="absolute inset-x-3 bottom-3 z-10 hidden items-center justify-center gap-2 rounded-full bg-white/95 py-2.5 text-[13px] font-semibold text-ink opacity-0 shadow-sm transition group-hover:opacity-100 focus-visible:opacity-100 md:flex"
        >
          <Eye size={16} /> Vista rápida
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-champagne-deep">
          {category?.name} · {product.materialType}
        </p>
        <h3 className="mt-1.5 font-serif text-[1.3rem] font-semibold leading-tight text-ink sm:text-[1.4rem]">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <p className="text-[15px] font-semibold text-ink">
            {formatPrice(product.price)}
            <span className="sr-only"> (precio de ejemplo)</span>
          </p>
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className="relative z-10 inline-flex h-10 items-center gap-1.5 rounded-full bg-ink pl-3 pr-4 text-[13px] font-semibold text-ivory transition hover:bg-rose-deep disabled:bg-line disabled:text-muted"
            aria-label={soldOut ? `${product.name} agotado` : hasOptions ? `Elegir opción de ${product.name}` : `Agregar ${product.name} al carrito`}
          >
            <Plus size={15} strokeWidth={2.25} />
            {soldOut ? "Agotado" : hasOptions ? "Elegir" : "Agregar"}
          </button>
        </div>
      </div>

      <QuickViewModal product={product} open={quickOpen} onClose={() => setQuickOpen(false)} />
    </article>
  );
}
