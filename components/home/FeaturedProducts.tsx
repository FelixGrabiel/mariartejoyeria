"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ArrowRight } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/misc";

export function FeaturedProducts() {
  const { storeProducts, hydrated } = useStore();
  const featured = storeProducts.filter((p) => p.featured).slice(0, 4);
  if (hydrated && featured.length === 0) return null;

  return (
    <section aria-labelledby="featured-title" className="container-page mt-20 sm:mt-28">
      <SectionHeading
        id="featured-title"
        eyebrow="Las favoritas"
        title="Piezas para enamorarte"
        description="Una selección de nuestras joyas."
        action={
          <Link href="/catalogo" className="link-underline inline-flex items-center gap-1 text-sm font-semibold text-rose-deep">
            Ver todo el catálogo <ArrowRight size={15} />
          </Link>
        }
      />
      <ProductGrid products={featured} loading={!hydrated} />
    </section>
  );
}
