import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/CatalogView";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Pulseras, collares, anillos, sets y regalos con significado. Busca y filtra por categoría, material y precio.",
};

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="container-page py-16 text-muted">Cargando catálogo…</div>}>
      <CatalogView />
    </Suspense>
  );
}
