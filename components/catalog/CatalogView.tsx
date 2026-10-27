"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { categories, getCategory } from "@/data/categories";
import { site } from "@/data/site";
import {
  emptyFilters,
  filterProducts,
  isSoldOut,
  priceRanges,
  sortProducts,
  type CatalogFilters,
  type SortOption,
} from "@/lib/catalog";
import type { CategoryId } from "@/types";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState, SearchIllustration } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ChevronRight, Sliders, X } from "@/components/ui/icons";
import { FilterPanel } from "./FilterPanel";
import { SearchBar } from "./SearchBar";
import { SortSelect } from "./SortSelect";

function filtersFromParams(params: URLSearchParams): CatalogFilters {
  const cat = params.get("categoria");
  const validCat = categories.some((c) => c.id === cat) ? [cat as CategoryId] : [];
  const tema = params.get("tema");
  return { ...emptyFilters, query: params.get("q") ?? "", categories: validCat, themes: tema ? [tema] : [] };
}

export function CatalogView() {
  const searchParams = useSearchParams();
  const paramsKey = searchParams?.toString() ?? "";
  const { storeProducts, hydrated, activeThemes } = useStore();
  const [filters, setFilters] = useState<CatalogFilters>(() => filtersFromParams(new URLSearchParams(paramsKey)));
  const [sort, setSort] = useState<SortOption>("destacados");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Si cambian los parámetros (p. ej. búsqueda desde el header), reiniciamos filtros.
  useEffect(() => {
    setFilters(filtersFromParams(new URLSearchParams(paramsKey)));
  }, [paramsKey]);

  const categoryNames = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), []);

  const results = useMemo(
    () => sortProducts(filterProducts(storeProducts, filters, categoryNames), sort),
    [storeProducts, filters, sort, categoryNames],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of storeProducts) {
      map[p.categoryId] = (map[p.categoryId] ?? 0) + 1;
      map[p.materialType] = (map[p.materialType] ?? 0) + 1;
      for (const t of p.themeIds ?? []) map[`tema:${t}`] = (map[`tema:${t}`] ?? 0) + 1;
    }
    return map;
  }, [storeProducts]);

  const soldOutCount = results.filter(isSoldOut).length;

  const activeChips: { key: string; label: string; remove: () => void }[] = [
    ...filters.categories.map((id) => ({
      key: `c-${id}`,
      label: getCategory(id)?.name ?? id,
      remove: () => setFilters((f) => ({ ...f, categories: f.categories.filter((c) => c !== id) })),
    })),
    ...filters.themes.map((id) => ({
      key: `t-${id}`,
      label: activeThemes.find((t) => t.id === id)?.name ?? id,
      remove: () => setFilters((f) => ({ ...f, themes: f.themes.filter((x) => x !== id) })),
    })),
    ...filters.materials.map((m) => ({
      key: `m-${m}`,
      label: m,
      remove: () => setFilters((f) => ({ ...f, materials: f.materials.filter((x) => x !== m) })),
    })),
    ...(filters.price !== "todos"
      ? [{ key: "price", label: priceRanges.find((r) => r.value === filters.price)?.label ?? "", remove: () => setFilters((f) => ({ ...f, price: "todos" })) }]
      : []),
    ...(filters.onlyAvailable
      ? [{ key: "avail", label: "Solo disponibles", remove: () => setFilters((f) => ({ ...f, onlyAvailable: false })) }]
      : []),
  ];

  const activeCount = activeChips.length;
  const singleCategory = filters.categories.length === 1 ? getCategory(filters.categories[0]) : undefined;
  const sampleCategory = singleCategory && !singleCategory.image;
  const singleTheme = filters.themes.length === 1 ? activeThemes.find((t) => t.id === filters.themes[0]) : undefined;

  return (
    <div className="container-page pt-6 sm:pt-8">
      <nav aria-label="Ruta de navegación" className="mb-5 text-[13px] text-muted">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-ink">Inicio</Link></li>
          <li aria-hidden="true"><ChevronRight size={13} /></li>
          <li aria-current="page" className="text-ink">Catálogo</li>
        </ol>
      </nav>

      <header className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow mb-3">{singleTheme ? "Joyas con significado" : singleCategory ? singleCategory.name : "Todas las joyas"}</p>
          <h1 className="font-serif text-[2.6rem] font-semibold leading-none text-ink sm:text-[3.4rem]">
            {singleTheme ? singleTheme.name : singleCategory ? singleCategory.name : "Nuestra colección"}
          </h1>
          <p className="mt-3 max-w-lg text-[15px] text-muted">
            {singleTheme?.description || singleCategory?.description || "Piezas con significado para llevar, compartir y regalar."}
          </p>
        </div>
      </header>

      <div className="sticky top-[72px] z-30 -mx-4 mb-6 border-y border-line/70 bg-ivory/95 px-4 py-3 backdrop-blur sm:top-20 sm:mx-0 sm:rounded-full sm:border sm:px-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchBar value={filters.query} onChange={(query) => setFilters((f) => ({ ...f, query }))} />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary flex-1 lg:hidden"
              onClick={() => setFiltersOpen(true)}
              aria-haspopup="dialog"
            >
              <Sliders size={17} /> Filtros{activeCount ? ` (${activeCount})` : ""}
            </button>
            <div className="flex-1 sm:w-64 sm:flex-none">
              <SortSelect value={sort} onChange={setSort} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[230px_1fr]">
        <aside aria-label="Filtros" className="hidden lg:block">
          <div className="sticky top-44">
            <FilterPanel filters={filters} onChange={setFilters} counts={counts} />
            {activeCount > 0 && (
              <button type="button" onClick={() => setFilters({ ...emptyFilters, query: filters.query })} className="link-underline mt-6 text-sm font-semibold text-rose-deep">
                Limpiar filtros
              </button>
            )}
          </div>
        </aside>

        <section aria-labelledby="results-title">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <h2 id="results-title" className="mr-2 text-sm text-muted" aria-live="polite">
              {hydrated ? (
                <>
                  <strong className="font-semibold text-ink">{results.length}</strong> {results.length === 1 ? "joya" : "joyas"}
                  {soldOutCount > 0 && ` · ${soldOutCount} agotada${soldOutCount === 1 ? "" : "s"}`}
                </>
              ) : (
                "Cargando joyas…"
              )}
            </h2>
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.remove}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-blush-soft pl-3 pr-2 text-[13px] font-medium text-rose-deep hover:bg-blush"
                aria-label={`Quitar filtro ${chip.label}`}
              >
                {chip.label} <X size={14} />
              </button>
            ))}
          </div>

          {!hydrated ? (
            <ProductGrid products={[]} loading columns={3} skeletonCount={6} />
          ) : results.length === 0 ? (
            <EmptyState
              illustration={<SearchIllustration />}
              title="No encontramos coincidencias"
              description={
                filters.query
                  ? `No hay joyas que coincidan con «${filters.query}» y los filtros elegidos. Prueba con otra palabra o quita algún filtro.`
                  : "Ninguna joya coincide con estos filtros. Prueba quitando alguno."
              }
              action={
                <button type="button" className="btn btn-primary" onClick={() => setFilters(emptyFilters)}>
                  Ver todas las joyas
                </button>
              }
            />
          ) : (
            <ProductGrid products={results} columns={3} />
          )}
        </section>
      </div>

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtros"
        description={`${results.length} resultado${results.length === 1 ? "" : "s"}`}
        variant="sheet"
        footer={
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary flex-1" onClick={() => setFilters({ ...emptyFilters, query: filters.query })}>
              Limpiar
            </button>
            <button type="button" className="btn btn-primary flex-[2]" onClick={() => setFiltersOpen(false)}>
              Ver {results.length} {results.length === 1 ? "joya" : "joyas"}
            </button>
          </div>
        }
      >
        <FilterPanel filters={filters} onChange={setFilters} counts={counts} />
      </Modal>
    </div>
  );
}
