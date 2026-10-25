"use client";

import { cn } from "@/lib/format";
import type { Product } from "@/types";
import { ProductCardSkeleton } from "@/components/ui/misc";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  loading = false,
  columns = 4,
  skeletonCount = 4,
}: {
  products: Product[];
  loading?: boolean;
  columns?: 3 | 4;
  skeletonCount?: number;
}) {
  const grid = cn(
    "grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3",
    columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
  );

  if (loading) {
    return (
      <div className={grid} aria-busy="true" aria-label="Cargando joyas">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <ul className={grid}>
      {products.map((product, i) => (
        <li key={product.id} className="flex">
          <div className="w-full">
            <ProductCard product={product} priority={i < 2} />
          </div>
        </li>
      ))}
    </ul>
  );
}
