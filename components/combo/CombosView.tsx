"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/misc";
import { ComboCard } from "./ComboCard";

export function CombosView() {
  const { hydrated, liveCombos } = useStore();

  return (
    <div className="container-page pt-8 sm:pt-10">
      <header className="mb-8">
        <p className="eyebrow mb-3">Para compartir</p>
        <h1 className="font-serif text-[2.6rem] font-semibold leading-none sm:text-[3.4rem]">Combina y ahorra</h1>
        <p className="mt-3 max-w-xl text-[15px] text-muted">
          Conjuntos de joyas para parejas, mejores amigas o madre e hija. El ahorro aparece solo cuando la tienda tiene una promoción activa.
        </p>
      </header>

      {!hydrated ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      ) : liveCombos.length === 0 ? (
        <EmptyState
          title="Todavía no hay combos disponibles"
          description="Cuando la tienda arme conjuntos o promociones, los verás aquí. Mientras tanto, explora el catálogo."
          action={
            <Link href="/catalogo" className="btn btn-primary">
              Ir al catálogo
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {liveCombos.map((c) => (
            <ComboCard key={c.id} combo={c} />
          ))}
        </div>
      )}
    </div>
  );
}
