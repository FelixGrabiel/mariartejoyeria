"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { EmptyState, HeartIllustration } from "@/components/ui/EmptyState";
import { ProductGrid } from "./ProductGrid";

export function FavoritesView() {
  const { hydrated, favorites, storeProducts } = useStore();
  const list = storeProducts.filter((p) => favorites.includes(p.id));

  return (
    <div className="container-page pt-8 sm:pt-10">
      <p className="eyebrow mb-3">Guardadas para después</p>
      <h1 className="font-serif text-[2.6rem] font-semibold leading-none sm:text-[3.2rem]">Mis favoritos</h1>
      <p className="mt-3 text-[15px] text-muted">Se guardan en este navegador. Agrégalas al carrito cuando estés lista o listo.</p>

      <div className="mt-10">
        {!hydrated ? (
          <ProductGrid products={[]} loading />
        ) : list.length === 0 ? (
          <EmptyState
            illustration={<HeartIllustration />}
            title="Aún no tienes favoritos"
            description="Toca el corazón de cualquier joya para guardarla aquí."
            action={
              <Link href="/catalogo" className="btn btn-primary">
                Explorar catálogo
              </Link>
            }
          />
        ) : (
          <ProductGrid products={list} />
        )}
      </div>
    </div>
  );
}
